# GitHub release and monetization

## What GitHub can do for Atlas

- Host the source repository and issue tracker.
- Host the static Atlas web build through GitHub Pages.
- Publish versioned web ZIPs and Android release notes through GitHub Releases.
- Run tests and build artifacts with GitHub Actions.

## What GitHub is not

A normal GitHub repository or Release is not a checkout for Atlas Plus. Do not put a card form or private entitlement secret in the client repository. For people installing Atlas from Google Play, digital features and subscriptions should be sold through the Play-compliant billing path.

GitHub Marketplace can process paid plans for a qualifying, verified GitHub Marketplace app, but that is a separate integration for GitHub users and organisations. It is not the same as selling a downloadable Android app. GitHub Sponsors is suitable for one-time or recurring support, not for granting Atlas Plus access unless a separate, reviewed entitlement system is built.

## Before making the repository public

- Confirm that no service-role key, private key, password, export or production credential is present.
- Decide whether the code is proprietary or open source and add the correct licence only after that decision.
- Review screenshots, sample data, issue templates and commit history for personal or sensitive information.
- Configure GitHub Pages and Actions only after the release branch is reviewed.
