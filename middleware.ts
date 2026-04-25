import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/signin",
  },
});

export const config = {
  matcher: [
    "/((?!api/auth|api/user|api/civic|api/permits|api/places|api/resources|api/legislators|api/census|api/federal-spending|_next/static|_next/image|favicon\\.ico|logo\\.png|ithaca-election-districts\\.geojson|signin|signup|onboarding).*)",
  ],
};
