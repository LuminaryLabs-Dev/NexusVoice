# Upgrading

## Preview compatibility

Versions below `1.0.0` may change public API while the runtime is being proven.
Read `CHANGELOG.md` before replacing an existing preview.

## Safe upgrade

1. Stop Play Mode.
2. Back up the project.
3. Replace or update the package.
4. Let Unity recompile.
5. Resolve renamed events or fields listed in the changelog.
6. Run Edit Mode and Play Mode package tests.
7. Rebuild and launch every supported player target.
