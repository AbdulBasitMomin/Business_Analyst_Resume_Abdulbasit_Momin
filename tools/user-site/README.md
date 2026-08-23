# The `abdulbasitmomin.github.io` repository

This directory is the **entire intended contents** of the
`AbdulBasitMomin/abdulbasitmomin.github.io` repository. Two files: a redirect
page and `.nojekyll`.

## Why a redirect and not a copy of the site

Both addresses have to work:

- `https://abdulbasitmomin.github.io/` is the short one worth sharing.
- `https://abdulbasitmomin.github.io/Business_Analyst_Resume_Abdulbasit_Momin/`
  is already printed on a resume that has been sent out, so it cannot break.

Renaming the resume repository to `abdulbasitmomin.github.io` would satisfy the
first and break the second: the rename converts a project site into a user
site, and the old path stops resolving.

That leaves either two copies of the site or one copy and a forward. Two copies
means every future edit has to be made twice, and they drift. That is not
hypothetical here: the resume PDF was maintained separately for exactly this
reason and ended up listing different certifications from the page, which is
why it is now generated from the same source.

So the resume stays in one repository and this page forwards to it.

## Installing it

1. In the `abdulbasitmomin.github.io` repository, remove the current contents
   (`index.html`, `assets/`, `tools/`, `README.md`, `robots.txt`,
   `sitemap.xml`). That copy is a snapshot and is already behind: among other
   things it predates the fix for search results not navigating.
2. Add the `index.html` and `.nojekyll` from this directory.
3. Settings, then Pages: Source "Deploy from a branch", branch `main`, folder
   `/ (root)`.

`.nojekyll` is there because a branch-deployed Pages site runs Jekyll by
default, which ignores paths beginning with an underscore and can fail the
build outright. The file switches that off.

## What it handles

- Forwards with `location.replace`, so Back leaves cleanly instead of bouncing.
- Carries the query and hash across, because `?trace=SQL` selects one
  capability and `#experience` jumps to a section. A bare `meta refresh` drops
  both.
- Works with JavaScript off, via the `meta refresh` and a visible link.
- `noindex, follow` plus a canonical pointing at the resume, so a crawler
  credits the real page rather than treating this as a duplicate.
