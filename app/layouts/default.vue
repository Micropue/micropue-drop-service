<template>
    <header class="site-header">
        <nav class="navbar" aria-label="主导航">
            <BrandLogo class="header-brand" />
            <div class="nav-actions">
                <Button as-child v-slot="slotProps">
                    <NuxtLink to="/sign" :class="[slotProps.class, 'auth-button']" v-bind="slotProps.a11yAttrs">
                        <span class="auth-label-full">Log In / Sign Up</span>
                        <span class="auth-label-short">Log In</span>
                    </NuxtLink>
                </Button>
            </div>
        </nav>
    </header>
    <main>
        <slot></slot>
    </main>
    <footer class="site-footer">
        <div class="footer-inner">
            <BrandLogo class="footer-brand" />
            <p class="footer-tagline">Free static site hosting for MICROPUE.</p>
            <div class="baseline">
                <div class="license">
                    <span class="license-title">Apache License 2.0</span>
                    <p class="license-text">
                        Drop is open source — the project is published under the
                        <a class="footer-link" href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank"
                            rel="noopener noreferrer">Apache License 2.0</a>.
                    </p>
                </div>
                <div class="connect">
                    <span class="connect-label">Connect:</span>
                    <a class="footer-link" href="mailto:micropue@micropue.com.cn">micropue@micropue.com.cn</a>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
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

            .auth-button {
                flex: none;
                min-height: 36px;
                white-space: nowrap;
            }

            .auth-label-short {
                display: none;
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
    min-height: calc(100vh - 70px - 320px);
}

/* ---------- 页脚 ---------- */
.site-footer {
    /* 浅色主题：近黑底（与主题色阶 zinc.950 一致） */
    background: #09090b;
    color: #fafafa;
    padding: 3.5rem 0 2rem;
}

/* 深色主题：比页面（#18181b）亮一档的浮起面板，否则页脚会与页面糊在一起 */
@media (prefers-color-scheme: dark) {
    .site-footer {
        background: #1f1f23;
    }
}

.footer-inner {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    width: 90%;
    max-width: 1300px;
    margin: 0 auto;
}

.footer-brand {
    font-size: 2rem;
    align-self: flex-start;
}

.footer-tagline {
    margin: -1.5rem 0 0;
    font-size: 0.95rem;
    opacity: 0.72;
}

/* 底部一行里的邮箱链接 */
.footer-link {
    color: inherit;
    text-decoration: none;
    opacity: 0.72;
    transition: opacity 0.15s;
}

.footer-link:hover {
    opacity: 1;
}

.baseline {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem 2rem;
    padding-top: 1.75rem;
    border-top: 1px dashed color-mix(in srgb, currentColor 35%, transparent);
    font-size: 0.85rem;
}

.license {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.license-title {
    font-size: 0.95rem;
    font-weight: 500;
}

.license-text {
    margin: 0;
    max-width: 36rem;
    font-size: 0.85rem;
    line-height: 1.6;
    opacity: 0.72;
}

.license-text .footer-link {
    text-decoration: underline;
    text-underline-offset: 3px;
}

.connect {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.connect-label {
    opacity: 0.55;
}
</style>
