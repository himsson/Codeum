// Псевдотерминал (PTY) для Codeum: создаёт пару master/slave, запускает процесс
// с терминалом на slave и отдаёт в Java дескриптор master. Благодаря этому
// в терминале работают vim, htop, nano, ssh с паролем и Tab-дополнение.
#include <dirent.h>
#include <errno.h>
#include <fcntl.h>
#include <jni.h>
#include <signal.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <sys/wait.h>
#include <termios.h>
#include <unistd.h>

static char **to_cstrings(JNIEnv *env, jobjectArray arr) {
    if (arr == NULL) return NULL;
    jsize n = (*env)->GetArrayLength(env, arr);
    char **out = calloc((size_t) n + 1, sizeof(char *));
    for (jsize i = 0; i < n; i++) {
        jstring s = (jstring) (*env)->GetObjectArrayElement(env, arr, i);
        const char *c = (*env)->GetStringUTFChars(env, s, NULL);
        out[i] = strdup(c);
        (*env)->ReleaseStringUTFChars(env, s, c);
        (*env)->DeleteLocalRef(env, s);
    }
    return out;
}

static void throw_io(JNIEnv *env, const char *msg) {
    jclass cls = (*env)->FindClass(env, "java/io/IOException");
    (*env)->ThrowNew(env, cls, msg);
}

// Возвращает [fd мастера, pid процесса]
JNIEXPORT jintArray JNICALL
Java_app_codeum_Pty_start(JNIEnv *env, jclass clazz, jstring jcmd, jobjectArray jargs,
                          jobjectArray jenv, jstring jcwd, jint rows, jint cols) {
    int ptm = open("/dev/ptmx", O_RDWR | O_CLOEXEC);
    if (ptm < 0) { throw_io(env, "не удалось открыть /dev/ptmx"); return NULL; }
    char devname[64];
    if (grantpt(ptm) || unlockpt(ptm) || ptsname_r(ptm, devname, sizeof(devname))) {
        close(ptm); throw_io(env, "не удалось настроить PTY"); return NULL;
    }

    struct termios tios;
    tcgetattr(ptm, &tios);
    tios.c_iflag |= IUTF8;
    tios.c_iflag &= ~(IXON | IXOFF);
    tcsetattr(ptm, TCSANOW, &tios);
    struct winsize sz = {.ws_row = (unsigned short) rows, .ws_col = (unsigned short) cols};
    ioctl(ptm, TIOCSWINSZ, &sz);

    // всё, что нужно после fork, готовим заранее: JNI в дочернем процессе вызывать нельзя
    const char *cmd_c = (*env)->GetStringUTFChars(env, jcmd, NULL);
    char *cmd = strdup(cmd_c);
    (*env)->ReleaseStringUTFChars(env, jcmd, cmd_c);
    const char *cwd_c = (*env)->GetStringUTFChars(env, jcwd, NULL);
    char *cwd = strdup(cwd_c);
    (*env)->ReleaseStringUTFChars(env, jcwd, cwd_c);
    char **argv = to_cstrings(env, jargs);
    char **envp = to_cstrings(env, jenv);

    pid_t pid = fork();
    if (pid < 0) {
        close(ptm); throw_io(env, "fork не удался"); return NULL;
    }
    if (pid == 0) {
        // дочерний процесс: новая сессия, slave-сторона PTY становится stdin/stdout/stderr
        sigset_t all;
        sigfillset(&all);
        sigprocmask(SIG_UNBLOCK, &all, NULL);
        close(ptm);
        setsid();
        int pts = open(devname, O_RDWR);
        if (pts < 0) _exit(126);
        dup2(pts, 0); dup2(pts, 1); dup2(pts, 2);
        DIR *d = opendir("/proc/self/fd");
        if (d) {
            int self = dirfd(d);
            struct dirent *e;
            while ((e = readdir(d)) != NULL) {
                int fd = atoi(e->d_name);
                if (fd > 2 && fd != self) close(fd);
            }
            closedir(d);
        }
        for (int s = 1; s < 32; s++) signal(s, SIG_DFL);
        clearenv();
        if (envp) for (char **p = envp; *p; p++) putenv(*p);
        if (chdir(cwd) != 0) chdir("/");
        execvp(cmd, argv);
        _exit(127);
    }

    free(cmd); free(cwd);
    if (argv) { for (char **p = argv; *p; p++) free(*p); free(argv); }
    if (envp) { for (char **p = envp; *p; p++) free(*p); free(envp); }

    jintArray res = (*env)->NewIntArray(env, 2);
    jint vals[2] = {ptm, pid};
    (*env)->SetIntArrayRegion(env, res, 0, 2, vals);
    return res;
}

JNIEXPORT void JNICALL
Java_app_codeum_Pty_resize(JNIEnv *env, jclass clazz, jint fd, jint rows, jint cols) {
    struct winsize sz = {.ws_row = (unsigned short) rows, .ws_col = (unsigned short) cols};
    ioctl(fd, TIOCSWINSZ, &sz);
}

// Ждёт завершения процесса и возвращает код выхода (или 128+сигнал)
JNIEXPORT jint JNICALL
Java_app_codeum_Pty_waitFor(JNIEnv *env, jclass clazz, jint pid) {
    int status = 0;
    while (waitpid(pid, &status, 0) < 0) {
        if (errno != EINTR) return -1;
    }
    if (WIFEXITED(status)) return WEXITSTATUS(status);
    if (WIFSIGNALED(status)) return 128 + WTERMSIG(status);
    return 0;
}

JNIEXPORT void JNICALL
Java_app_codeum_Pty_kill(JNIEnv *env, jclass clazz, jint pid, jint sig) {
    kill(-pid, sig);  // вся группа процессов сессии
    kill(pid, sig);
}

JNIEXPORT void JNICALL
Java_app_codeum_Pty_close(JNIEnv *env, jclass clazz, jint fd) {
    close(fd);
}
