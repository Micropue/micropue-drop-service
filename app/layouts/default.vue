<template>
    <header class="site-header">
        <nav class="navbar" aria-label="主导航">
            <BrandLogo class="header-brand" />
            <div class="nav-actions">
                <Button as="a" class="github-link" severity="secondary" rounded :href="githubUrl" target="_blank"
                    rel="noopener noreferrer">
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

    <Dialog :visible="privacyOpen" modal header="Privacy Policy" :closable="false" :close-on-escape="false"
        :dismissable-mask="false" :draggable="false" :style="{ width: 'min(520px, 92vw)' }">
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
import SignOut from '@primeicons/vue/sign-out'
import Check from '@primeicons/vue/check'

const githubUrl = 'https://github.com/Micropue/micropue-drop-service'
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
    await $fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
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
