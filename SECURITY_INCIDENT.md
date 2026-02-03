# 🔐 Security Alert - API Key Exposure

## ⚠️ IMMEDIATE ACTION REQUIRED

A Google Gemini API key was accidentally committed to this repository and is now public.

### What to do RIGHT NOW:

1. **Revoke the exposed API key:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find the key: `AIzaSyBk4Slqp-oUdNAbSUcZSpVI8pomVw7FqVg`
   - Delete it immediately

2. **Generate a new API key:**
   - Create a new restricted API key
   - Add restrictions (HTTP referrers, IP addresses, or API restrictions)
   - Store it securely in `server/.env` (this file is gitignored)

3. **Update your local environment:**
   ```bash
   # In server/.env
   GEMINI_API_KEY=your-new-key-here
   AI_PROVIDER=gemini
   ```

### Git History Cleanup (Optional but Recommended):

The key exists in git history. To completely remove it:

```bash
# WARNING: This rewrites history and requires force push
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch test-api.js" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (coordinate with team first!)
git push origin --force --all
```

**Alternative (easier):** Just revoke the key and move forward. Old commits will still have it, but it will be useless.

### Prevention Measures Implemented:

✅ Created `.gitignore` in root directory
✅ Removed hardcoded API key from `test-api.js`
✅ Added security warning comment
✅ Environment variables now loaded from system or .env files

### Best Practices Going Forward:

1. **Never** commit API keys, passwords, or secrets
2. Always use `.env` files (and ensure they're in `.gitignore`)
3. Use environment variables in CI/CD
4. Consider using secret management tools (AWS Secrets Manager, HashiCorp Vault, etc.)
5. Enable GitHub secret scanning alerts

---

**Status:** The exposed key has been removed from code, but it still exists in git history. The key MUST be revoked in Google Cloud Console.
