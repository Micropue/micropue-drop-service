<template>
  <article class="policy">
    <header>
      <p class="eyebrow">MICROPUE DROP</p>
      <h1>Privacy Policy</h1>
      <p class="updated">Last updated: November 11, 2026</p>
    </header>

    <p>
      DROP is a static-site hosting service operated as part of MICROPUE and as a companion to
      <a href="https://bits.micropue.com.cn" target="_blank" rel="noopener noreferrer">BITS</a>.
      This policy explains what information we collect, how we use it, who owns the content you publish,
      and the limits of our responsibility. By signing in or using DROP, you agree to this policy.
    </p>

    <h2>1. Information we collect</h2>
    <ul>
      <li>
        <strong>BITS account data.</strong> When you sign in with BITS we receive your BITS user ID, username,
        nickname, email address, avatar URL and profile URL. We store a local copy so we can identify the owner of
        each project. We never receive or store your BITS password.
      </li>
      <li>
        <strong>Project data.</strong> The HTML, CSS and JS files you upload, project names, URLs, folders,
        visibility settings and a scrypt hash of any project password. File contents are stored in our database,
        not on disk.
      </li>
      <li>
        <strong>Technical data.</strong> A session cookie, an OAuth state cookie, password-unlock cookies,
        request timestamps, and the IP address used for password-attempt rate limiting. We do not use advertising
        trackers and we do not sell personal data.
      </li>
    </ul>

    <h2>2. How we use information</h2>
    <ul>
      <li>To sign you in through BITS and keep you signed in.</li>
      <li>To store, serve and protect your projects, including public, password-protected and disabled sites.</li>
      <li>To prevent abuse, brute-force attempts and security incidents.</li>
      <li>To operate, debug and improve the service, and to comply with legal obligations.</li>
    </ul>

    <h2>3. Cookies</h2>
    <ul>
      <li><code>drop_session</code> keeps you signed in for up to 7 days. It is HttpOnly and host-only.</li>
      <li><code>drop_oauth_state</code> protects the BITS OAuth flow and expires after 10 minutes.</li>
      <li><code>drop_unlock_*</code> remembers a successful password entry for a specific project for 12 hours.</li>
    </ul>
    <p>Cloudflare and our hosting provider may set security-related cookies or process request metadata as part of delivering the service.</p>

    <h2>4. Ownership of published content</h2>
    <ul>
      <li>
        <strong>You own your content.</strong> All HTML, CSS, JS, text, images, designs and other material you
        publish through DROP remain your property. DROP and MICROPUE claim no ownership of it.
      </li>
      <li>
        To operate the service, you grant us a limited, non-exclusive, worldwide, royalty-free licence to store,
        reproduce, transmit and display your content solely for hosting it at the URL you choose and for related
        backups and security checks. This licence ends when you delete the content, except for copies kept in
        ordinary backups for a limited period.
      </li>
      <li>
        <strong>You are solely responsible for your content.</strong> You confirm that you have all rights needed
        to publish it and that it does not infringe anyone else's rights or violate any law.
      </li>
      <li>
        DROP does not pre-screen, verify, endorse or take responsibility for user content. Opinions and claims in
        published projects belong to their publishers, not to DROP or MICROPUE.
      </li>
    </ul>

    <h2>5. Content management</h2>
    <ul>
      <li>You can edit, disable or delete your projects at any time from the dashboard.</li>
      <li>
        We do not monitor content as a rule. We may remove or disable content, or suspend access, when we
        reasonably believe it is illegal, abusive, malicious, infringing, a security risk, or required by law.
        Where practical we will notify the owner, but we are not obliged to do so.
      </li>
      <li>We do not guarantee that any project will remain available, complete or permanently stored.</li>
    </ul>

    <h2>6. Third-party services</h2>
    <p>
      DROP relies on BITS for authentication, Cloudflare for network delivery and protection, and infrastructure
      providers for database and server hosting. Those services process data under their own policies. Links from
      published projects to external sites are controlled by their owners, not by DROP.
    </p>

    <h2>7. Security</h2>
    <p>
      We use reasonable technical measures, including HttpOnly session cookies, hashed project passwords, scoped
      access checks and rate limiting. No service is completely secure, and we cannot guarantee absolute security.
      Please do not publish secrets, credentials or sensitive personal data in a public project.
    </p>

    <h2>8. Retention and deletion</h2>
    <p>
      Account data is kept while your account exists. Project files are deleted when you delete the project.
      Backups and logs may persist for a limited period. To request deletion of your DROP account data, contact
      the operator through the channel below; we may need to verify ownership through BITS first.
    </p>

    <h2>9. Children</h2>
    <p>DROP is not intended for children under the age required to consent to online services in their jurisdiction.</p>

    <h2>10. Disclaimer and limitation of liability</h2>
    <ul>
      <li>
        DROP is provided <strong>“as is” and “as available”</strong>, without warranties of any kind, express or
        implied, including availability, fitness for a particular purpose or non-infringement.
      </li>
      <li>
        To the maximum extent permitted by applicable law, DROP, MICROPUE and their operators are not liable for
        any user content, or for any loss, damage, downtime, data loss, security incident or legal claim arising
        from your use of the service or from content published by you or others.
      </li>
      <li>
        You agree to indemnify and hold harmless the operator against claims, damages and costs arising from your
        content or your violation of this policy or applicable law.
      </li>
      <li>Nothing in this policy limits liability that cannot be limited by law.</li>
    </ul>

    <h2>11. Changes to this policy</h2>
    <p>
      We may update this policy from time to time. The updated date at the top will change. Continued use of DROP
      after an update means you accept the revised policy.
    </p>

    <h2>12. Contact</h2>
    <p>
      Questions or requests about privacy or content can be raised via
      <a href="https://github.com/Micropue/micropue-drop-service/issues" target="_blank" rel="noopener noreferrer">the
        project issue tracker</a> or through BITS. Please include the project URL and your BITS username.
    </p>

    <h2>13. Your acceptance</h2>
    <p>
      By signing in, creating a project or otherwise using DROP, you confirm that you have read and agree to this
      Privacy Policy, including the content ownership, content management and liability sections above. If you do
      not agree, do not use the service.
    </p>
  </article>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'plain' })

useHead({ title: 'Privacy Policy' })
</script>

<style scoped lang="scss">
.policy {
  width: 90%;
  max-width: 760px;
  margin: 0 auto;
  padding: 2.5rem 0 5rem;
  line-height: 1.75;

  header {
    margin-bottom: 2rem;
  }

  .eyebrow {
    margin: 0 0 0.5rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: var(--p-text-muted-color);
  }

  h1 {
    margin: 0;
    font-size: 2rem;
  }

  .updated {
    margin: 0.5rem 0 0;
    font-size: 0.8rem;
    color: var(--p-text-muted-color);
  }

  h2 {
    margin: 2.2rem 0 0.75rem;
    font-size: 1rem;
  }

  p,
  li {
    font-size: 0.9rem;
    color: var(--p-text-muted-color);
  }

  p {
    margin: 0 0 1rem;
  }

  ul {
    margin: 0 0 1rem;
    padding-left: 1.2rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  strong {
    color: var(--p-text-color);
  }

  code {
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    background: var(--p-content-hover-background);
    font-family: var(--font-code);
    font-size: 0.82em;
  }

  a {
    color: var(--p-text-color);
  }
}
</style>
