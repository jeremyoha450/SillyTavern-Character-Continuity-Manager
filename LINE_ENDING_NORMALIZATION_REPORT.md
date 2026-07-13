# Line-Ending Normalization Report

**Date:** 2026-07-13
**Commit:** `612e5d035ecc3d445f93acfa38d01db3a4debd82`
**Manifest:** `1.0.0-rc1` unchanged

## Finding

The 89 fresh-clone artifact/install mismatches were line endings only. After converting CRLF and CR to LF in memory, all 89 pairs were byte-identical. There were no missing files and no content differences.

The committed blobs were already LF, so `git add --renormalize .` staged zero existing files. The reproducibility defect was the absence of a checkout policy: Windows Git could materialize text as CRLF. The new root `.gitattributes` fixes future checkouts without changing application content.

## Policy

```gitattributes
* text=auto eol=lf

*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.webp binary
*.ico binary
*.svgz binary
*.zip binary
*.gz binary
*.7z binary
*.rar binary
*.woff binary
*.woff2 binary
*.ttf binary
*.otf binary
*.pdf binary
```

## Result

- Existing files renormalized: 0.
- Policy file added: 1.
- Staged review: only `.gitattributes`, 18 insertions; `git diff --cached --check` passed.
- Fresh-clone source to artifact: 104/104 hashes identical, 0 missing, 0 different.
- Fresh-clone artifact to installed extension: 104/104 hashes identical, 0 missing, 0 different.
- Aggregate per-file hash-set digest for source, artifact, and install: `06dc673386dc32a5d6b3f7ddb4df4401c6ba19cd42c187a276604bceea5232a4`.
