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
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Github from '@primeicons/vue/github'
import ArrowUpRight from '@primeicons/vue/arrow-up-right'
import SignIn from '@primeicons/vue/sign-in'

const githubUrl = 'https://github.com/Micropue/micropue-drop-service'
const { data } = useFetch<{ stars: number | null }>('/api/github/star')

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
</style>
