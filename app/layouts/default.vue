<template>
    <header class="site-header">
        <nav class="navbar" aria-label="主导航">
            <BrandLogo class="header-brand" />
            <div class="nav-actions">
                <NuxtLink to="/privacy" class="privacy-trigger" aria-label="Privacy Policy">
                    <Book aria-hidden="true" />
                    <span class="privacy-trigger-label">Privacy</span>
                </NuxtLink>
                <Button class="github-link" severity="secondary" rounded type="button" @click="reposOpen = true">
                    <Github aria-hidden="true" />
                    <span v-if="starLabel">{{ starLabel }} Stars</span>
                </Button>
                <template v-if="authUser">
                    <Button as-child v-slot="slotProps" text severity="secondary">
                        <NuxtLink to="/account" :class="[slotProps.class, 'auth-button', 'auth-button--account']"
                            v-bind="slotProps.a11yAttrs">
                            <UserAvatar :src="authUser.avatarUrl" :size="22" />
                            <span class="auth-name">{{ authUser.nickname || authUser.username }}</span>
                            <ArrowUpRight class="auth-arrow" aria-hidden="true" />
                        </NuxtLink>
                    </Button>
                </template>
                <template v-else>
                    <Button as-child v-slot="slotProps">
                        <a href="/api/auth/bits" :class="[slotProps.class, 'auth-button']" v-bind="slotProps.a11yAttrs">
                            <SignIn class="auth-icon" aria-hidden="true" />
                            <span class="auth-label-full">Log In / Sign Up</span>
                            <span class="auth-label-short">Log In</span>
                        </a>
                    </Button>
                </template>
            </div>
        </nav>
    </header>
    <main>
        <slot></slot>
    </main>

    <Teleport to="body">
        <Transition name="repo-veil">
            <section v-if="reposOpen" class="repo-veil" :data-reveal-pending="repoRevealPending || undefined"
                ref="reposDialog" role="dialog" aria-modal="true" aria-labelledby="repo-veil-title" tabindex="-1"
                @click.self="closeRepositories">
                <div class="repo-panel">
                    <div class="repo-veil-bar">
                        <h2 ref="reposTitle" id="repo-veil-title">Drop Github Links.</h2>
                    </div>

                    <div class="repo-veil-inner">
                        <div ref="repoCards" class="repo-cards">
                            <SlideCommit v-for="repository in repositories" :key="repository.name" class="repo-slider"
                                :label="repository.name" done-label="Opening" error-label="Try again"
                                :on-confirm="() => openRepository(repository.url)" :width="slideWidth" :height="46"
                                :radius="23" track-color="#1b1b1e" handle-color="#f4f4f5" success-color="#ffffff"
                                danger-color="#ff6b6b" :hold-ms="600" />
                        </div>
                    </div>

                    <a ref="repositoryLink" class="repo-navigation-link" target="_blank" rel="noopener noreferrer"
                        tabindex="-1" aria-hidden="true"></a>
                </div>
            </section>
        </Transition>
    </Teleport>

    <Dialog :visible="privacyOpen" modal header="Privacy Policy" :closable="false" :close-on-escape="false"
        :dismissable-mask="false" :draggable="false" :style="{ width: 'fit-content' }">
        <div class="consent">
            <p>
                Before using DROP, please review and accept our Privacy Policy. It explains what we collect,
                that you own and are responsible for the content you publish, and the limits of our liability.
            </p>
            <p>
                <NuxtLink to="/privacy" target="_blank" rel="noopener noreferrer">Read the full Privacy Policy</NuxtLink>
            </p>
            <p v-if="consentError" class="consent-error" role="alert">{{ consentError }}</p>
        </div>
        <template #footer>
            <Button text @click="logout">
                <SignOut aria-hidden="true" />
                <span>Log out</span>
            </Button>
            <Button :loading="accepting" @click="acceptPrivacy">
                <Check aria-hidden="true" />
                <span>Agree and continue</span>
            </Button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Github from '@primeicons/vue/github'
import ArrowUpRight from '@primeicons/vue/arrow-up-right'
import SignIn from '@primeicons/vue/sign-in'
import Book from '@primeicons/vue/book'
import SignOut from '@primeicons/vue/sign-out'
import Check from '@primeicons/vue/check'

const { data } = useFetch<{ stars: number | null }>('/api/github/star')

const route = useRoute()
const { user: authUser } = useAuthUser()
const authLoaded = useState('auth-user-loaded', () => false)
if (!authLoaded.value) {
    const { data: authData } = await useFetch<{ user: AuthUser | null }>('/api/auth/me')
    authUser.value = authData.value?.user ?? null
    authLoaded.value = true
}

const starLabel = computed(() =>
    data.value?.stars == null
        ? ''
        : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(data.value.stars))

const repositories = [
    {
        name: 'DROP',
        url: 'https://github.com/Micropue/micropue-drop-service'
    },
    {
        name: 'DROP MCP',
        url: 'https://github.com/Micropue/micropue-drop-MCP'
    },
    {
        name: 'DROP CLI',
        url: 'https://github.com/Micropue/micropue-drop-CLI'
    }
] as const

const reposOpen = ref(false)
const reposDialog = ref<HTMLElement | null>(null)
const reposTitle = ref<HTMLHeadingElement | null>(null)
const repoCards = ref<HTMLDivElement | null>(null)
const repositoryLink = ref<HTMLAnchorElement | null>(null)
const repoRevealPending = ref(false)
const viewportWidth = ref(1440)
const slideWidth = computed(() => {
    const available = Math.max(200, viewportWidth.value - 96)
    return viewportWidth.value < 560 ? Math.min(280, available) : 280
})
let previousBodyOverflow = ''
let titleSplit: { words: Element[]; revert: () => void } | null = null
let revealTimeline: { kill: () => void } | null = null
let revealRun = 0

function clearRepoReveal() {
    revealRun += 1
    revealTimeline?.kill()
    revealTimeline = null
    titleSplit?.revert()
    titleSplit = null
}

async function revealRepositories() {
    clearRepoReveal()
    repoRevealPending.value = true

    const title = reposTitle.value
    const cards = repoCards.value
    if (!title || !cards || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        repoRevealPending.value = false
        return
    }

    const runId = revealRun
    try {
        const [{ gsap }, { SplitText }] = await Promise.all([import('gsap'), import('gsap/SplitText')])
        if (!reposOpen.value || runId !== revealRun) return

        gsap.registerPlugin(SplitText)
        titleSplit = SplitText.create(title, {
            type: 'words',
            mask: 'words',
            wordsClass: 'repo-title-word',
            aria: 'auto'
        })

        const sliders = cards.querySelectorAll<HTMLElement>('.repo-slider')
        gsap.set(titleSplit.words, { yPercent: 118, rotate: 1.5 })
        gsap.set(sliders, { autoAlpha: 0, y: 30, scale: 0.955 })
        repoRevealPending.value = false

        revealTimeline = gsap.timeline({ delay: 0.18 })
            .to(titleSplit.words, {
                yPercent: 0,
                rotate: 0,
                duration: 0.92,
                ease: 'power4.out',
                stagger: 0.075
            })
            .to(
                sliders,
                {
                    autoAlpha: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.82,
                    ease: 'power3.out',
                    stagger: 0.13,
                    clearProps: 'opacity,visibility,transform'
                },
                '-=0.52'
            )
    } catch {
        repoRevealPending.value = false
        clearRepoReveal()
    }
}

async function closeRepositories() {
    reposOpen.value = false
    await nextTick()
    document.querySelector<HTMLElement>('.github-link')?.focus()
}

function openRepository(url: string) {
    if (window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0) {
        window.location.assign(url)
        return
    }

    const link = repositoryLink.value
    if (!link) return
    link.href = url
    link.click()
    window.setTimeout(() => void closeRepositories(), 0)
}

function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && reposOpen.value) {
        event.preventDefault()
        void closeRepositories()
    }
}

function handleViewportResize() {
    viewportWidth.value = window.innerWidth
}

watch(reposOpen, async (open) => {
    const appRoot = document.getElementById('__nuxt')
    if (open) {
        repoRevealPending.value = true
        previousBodyOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        appRoot?.setAttribute('inert', '')
        handleViewportResize()
        await nextTick()
        reposDialog.value?.focus({ preventScroll: true })
        void revealRepositories()
    } else {
        clearRepoReveal()
        repoRevealPending.value = false
        document.body.style.overflow = previousBodyOverflow
        appRoot?.removeAttribute('inert')
    }
})

onMounted(() => {
    handleViewportResize()
    window.addEventListener('resize', handleViewportResize)
    window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
    clearRepoReveal()
    window.removeEventListener('resize', handleViewportResize)
    window.removeEventListener('keydown', handleGlobalKeydown)
    document.body.style.overflow = previousBodyOverflow
    document.getElementById('__nuxt')?.removeAttribute('inert')
})

// 政策页本身不弹同意框，否则会挡住阅读
const privacyOpen = computed(() => Boolean(authUser.value && !authUser.value.privacyAcceptedAt && route.path !== '/privacy'))
const accepting = ref(false)
const consentError = ref('')

async function acceptPrivacy() {
    if (accepting.value || !authUser.value) return
    accepting.value = true
    consentError.value = ''
    try {
        const response = await $fetch<{ acceptedAt: string }>('/api/account/consent', { method: 'POST' })
        authUser.value = { ...authUser.value, privacyAcceptedAt: response.acceptedAt }
    } catch {
        consentError.value = 'Could not record your acceptance. Please try again.'
    } finally {
        accepting.value = false
    }
}

async function logout() {
    try {
        await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
        window.location.href = '/'
    }
}
</script>

<style lang="scss" scoped>
header {
    position: relative;
    z-index: 2;
    height: 70px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    a {
        text-decoration: none;
    }

    // 仅普通链接重置颜色；p-button 链接保留主题文字色
    a:not(.p-button) {
        color: initial;
    }

    .header-brand {
        flex: none;
        font-size: 2.4em;
        white-space: nowrap;
    }

    nav {
        width: 90%;
        max-width: 1300px;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .nav-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .privacy-trigger {
                display: inline-flex;
                align-items: center;
                gap: 0.45rem;
                height: 36px;
                padding: 0 0.7rem;
                border: 1px solid var(--p-content-border-color);
                border-radius: 999px;
                color: var(--p-text-muted-color);
                font-size: 0.85rem;
                text-decoration: none;
                transition: border-color 0.15s, color 0.15s;

                &:hover,
                &:focus-visible {
                    border-color: var(--p-primary-color);
                    color: var(--p-text-color);
                }

                &.router-link-active {
                    border-color: color-mix(in srgb, var(--p-primary-color) 45%, var(--p-content-border-color));
                    color: var(--p-text-color);
                }
            }

            .github-link {
                width: fit-content;
                min-height: 36px;
                white-space: nowrap;

                svg {
                    width: 1.5em !important;
                    height: 1.5em !important;
                }

                display: flex;
                align-items: center;
                font-size: 1em;
            }

            .auth-button {
                display: inline-flex;
                align-items: center;
                gap: 0.4rem;
                flex: none;
                min-height: 36px;
                white-space: nowrap;
            }

            .auth-icon {
                width: 0.9rem;
                height: 0.9rem;
            }

            .auth-label-short {
                display: none;
            }

            .auth-button--account {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding-block: 0.35rem;
            }

            .auth-name {
                max-width: 9rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-weight: 500;
            }

            .auth-arrow {
                width: 0.8rem;
                height: 0.8rem;
                opacity: 0.7;
            }
        }
    }

    @media screen and (max-width: 700px) {
        .header-brand {
            font-size: 1.8em;

            :deep(.brand-name) {
                display: none;
            }
        }
    }

    @media screen and (max-width: 360px) {
        .header-brand {
            font-size: 1.5em;
        }
    }

    @media screen and (max-width: 820px) {
        .nav-actions .privacy-trigger-label {
            display: none;
        }

        .nav-actions .privacy-trigger {
            justify-content: center;
            width: 36px;
            padding: 0;
            border-radius: 50%;
        }
    }

    @media screen and (max-width: 560px) {
        nav .nav-actions .auth-label-full {
            display: none;
        }

        nav .nav-actions .auth-label-short {
            display: inline;
        }
    }
}

main {
    min-height: calc(100vh - 70px);
}

.repo-veil {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: grid;
    align-items: end;
    justify-items: end;
    padding: clamp(1rem, 2vw, 1.5rem);
    overflow: hidden;
    overscroll-behavior: contain;
    outline: none;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    color: #f5f5f5;
    isolation: isolate;
}

.repo-panel {
    position: relative;
    width: fit-content;
    max-width: 100%;
    max-height: calc(100dvh - 2rem);
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 0;
    border-radius: 0;
    background: #111113;
    box-shadow: none;
}

.repo-navigation-link {
    position: fixed;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
}

.repo-veil-enter-active {
    transition: opacity 320ms ease;
}

.repo-veil-leave-active {
    transition: opacity 220ms ease;
}

.repo-veil-enter-active .repo-panel {
    transition:
        transform 580ms cubic-bezier(0.22, 1, 0.36, 1),
        opacity 320ms ease;
}

.repo-veil-leave-active .repo-panel {
    transition:
        transform 260ms ease,
        opacity 220ms ease;
}

.repo-veil-enter-from,
.repo-veil-leave-to {
    opacity: 0;
}

.repo-veil-enter-from .repo-panel {
    transform: translateY(34px) scale(0.975);
    opacity: 0;
}

.repo-veil-leave-to .repo-panel {
    transform: translateY(16px) scale(0.985);
    opacity: 0;
}

.repo-veil-grid {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    opacity: 0.45;
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
    background-size: 54px 54px;
    mask-image: linear-gradient(to bottom, black, transparent 85%);
}

.repo-veil-bar {
    position: relative;
    z-index: 1;
    padding: 1.25rem 1.25rem 0.5rem;
    display: flex;
    align-items: center;

    h2 {
        margin: 0;
        font-size: clamp(1.65rem, 3vw, 1.9rem);
        font-weight: 650;
        letter-spacing: 0.015em;
        line-height: 1;
    }
}

.repo-veil-inner {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0.75rem 1.25rem 1.5rem;
}

.repo-veil[data-reveal-pending] {
    .repo-veil-bar h2,
    .repo-slider {
        opacity: 0;
    }
}

:deep(.repo-title-word-mask) {
    padding-bottom: 0.18em;
    margin-bottom: -0.18em;
}

:deep(.repo-title-word) {
    will-change: transform;
}

.repo-cards {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.72rem;
}

.repo-slider {
    flex: none;
}

@media (max-width: 560px) {
    .repo-veil {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 1.25rem;
        background: transparent;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
    }

    .repo-panel {
        width: fit-content;
        max-width: 100%;
        height: auto;
        min-height: 0;
        max-height: calc(100dvh - 2.5rem);
        border: 0;
        border-radius: 0;
        box-shadow: none;
    }

    .repo-veil-enter-from .repo-panel {
        transform: translate3d(0, 100%, 0);
        opacity: 1;
    }

    .repo-veil-leave-to .repo-panel {
        transform: translate3d(0, 100%, 0);
        opacity: 1;
    }

    .repo-veil-bar {
        padding-top: clamp(1.15rem, 4vw, 1.6rem);
        padding-bottom: 0.35rem;
    }

    .repo-veil-inner {
        padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
    }

    .repo-cards {
        gap: 0.8rem;
    }
}

@media (prefers-reduced-motion: reduce) {
    .repo-veil-enter-active,
    .repo-veil-leave-active {
        transition-duration: 1ms;
    }

    .repo-veil[data-reveal-pending] {
        .repo-veil-bar h2,
        .repo-slider {
            opacity: 1;
        }
    }

    .repo-veil-enter-active .repo-panel,
    .repo-veil-leave-active .repo-panel {
        transition-duration: 1ms;
    }
}

.consent {
    p {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        line-height: 1.65;
        color: var(--p-text-muted-color);
    }

    a {
        color: var(--p-text-color);
        font-size: 0.875rem;
    }
}

.consent-error {
    color: var(--p-red-500);
}

:deep(.p-dialog .p-button) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
}

:deep(.p-dialog .p-button svg) {
    width: 1rem;
    height: 1rem;
}
</style>
