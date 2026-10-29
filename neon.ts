import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Declare your Neon services here
  auth: false,
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // Short-lived feature branches auto-expire. Create persistent dev/QA branches
      // directly with `neon branches create` so they do not inherit this TTL.
      return { ttl: "7d" };
    }
    // Existing branch: no changes
    return {};
  },
});
