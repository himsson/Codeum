/*
 * forkshim — подгружается через LD_PRELOAD в Alpine (musl) на x86_64-устройствах.
 *
 * Seccomp-фильтр приложений Android на x86_64 запрещает системный вызов fork(57)/vfork(58),
 * а musl использует именно их. На arm64 этих вызовов не существует вовсе (musl там сам
 * делает clone), поэтому прослойка нужна только x86_64. Здесь fork/vfork выполняются как
 * clone(SIGCHLD) — это семантика обычного fork, и clone Android разрешает.
 *
 * Сборка (Android NDK):
 *   clang --target=x86_64-linux-musl -O2 -fPIC -shared -nostdlib -fno-stack-protector \
 *         -fuse-ld=lld -o app/src/main/assets/forkshim-x86_64.so native/forkshim.c
 */
#define SYS_clone 56
#define SIGCHLD 17

extern int *__errno_location(void);

static long raw_clone(void) {
    long ret;
    __asm__ volatile("syscall"
                     : "=a"(ret)
                     : "a"(SYS_clone), "D"((long)SIGCHLD), "S"(0L), "d"(0L)
                     : "rcx", "r11", "memory");
    return ret;
}

static int do_fork(void) {
    long r = raw_clone();
    if (r < 0 && r > -4096) {
        *__errno_location() = (int)-r;
        return -1;
    }
    return (int)r;
}

__attribute__((visibility("default"))) int fork(void) { return do_fork(); }
__attribute__((visibility("default"))) int vfork(void) { return do_fork(); }
__attribute__((visibility("default"))) int _Fork(void) { return do_fork(); }
