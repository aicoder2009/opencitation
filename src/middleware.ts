import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/cite',
  '/embed',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/share/(.*)',
  '/api/share/(.+)',
  '/api/lookup/(.*)',
  '/api/stats',
  '/api/stats/increment',
  '/api/badge(.*)',
  '/.well-known/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // W3C change-password URL: redirect to sign-in (Clerk owns the UI).
  if (req.nextUrl.pathname === '/.well-known/change-password') {
    return NextResponse.redirect(new URL('/sign-in', req.url), 302);
  }

  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|avif|png|gif|svg|ttf|woff2?|ico|csv|txt|xml|json|pdf|mp3|mp4|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
