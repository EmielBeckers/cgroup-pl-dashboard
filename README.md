This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Honest data rule (standing, 2026-07-08)

**No displayed figure may derive from a hardcoded ratio, an assumed split,
or any input not traceable to source data.** Every split carries a source
flag: `blanpla` (analytic distribution), `account` (GL account structure),
`mews` (PMS — pipeline pending), or `none` (shown undivided/undistributed,
never estimated). Background: the original mock generators fabricated a
Management/Service/Kitchen labour split from fixed ratios; it rendered as
fact until it was caught and purged on 2026-07-08.

Enforced by `npm run check:honest` (runs before every build): display code
must not multiply amounts by ratio literals, the mock renderer stays
totals-only, and no DB view/matview may contain a ratio in its definition
(`public.check_view_honesty()`).
