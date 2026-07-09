import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — readmemry",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="font-heading text-xl italic tracking-tight text-primary">
        readmemry
      </Link>
      <h1 className="mt-6 font-heading text-2xl">Privacy Policy</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated July 9, 2026.</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-heading text-lg">What we collect</h2>
          <p className="mt-2">
            When you create an account, we store your email address, username, and profile
            details (name, bio, avatar URL) that you choose to add. When you save a link — from
            the web app, the installed PWA, or the Chrome extension — we store the URL, its title,
            description, and preview image, along with any tags or notes you add and the comments
            you post.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg">Chrome extension</h2>
          <p className="mt-2">
            The readmemry Chrome extension reads the URL and title of the page you choose to save
            (via the <code>activeTab</code>{" "}
            permission — it does not read pages you don&apos;t interact with), and stores your
            personal access token and the app URL locally in your browser (via the{" "}
            <code>storage</code>{" "}
            permission) so it can authenticate your saves.
            It only sends network requests to your own readmemry app&apos;s domain.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg">How it&apos;s used</h2>
          <p className="mt-2">
            Your data is used solely to provide readmemry&apos;s features: your personal library,
            the social feed, public profiles, and comments. Saves are public by default and
            visible to people who follow you and on your public profile, unless marked private.
            We don&apos;t sell your data, run ads, or share it with third parties beyond the
            infrastructure that runs the app (our database and hosting providers).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg">Access tokens</h2>
          <p className="mt-2">
            Personal access tokens (used to connect the Chrome extension) are stored as
            one-way hashes — we can&apos;t read the token value back once it&apos;s generated. You
            can revoke a token at any time from Settings.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg">Your control over your data</h2>
          <p className="mt-2">
            You can edit your profile and delete individual saves, comments, or access tokens at
            any time from within the app. To request deletion of your full account and its data,
            contact us at the address below.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg">Contact</h2>
          <p className="mt-2">
            Questions about this policy? Reach out at{" "}
            <a href="mailto:jeffchavez0828@gmail.com" className="text-primary underline">
              jeffchavez0828@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
