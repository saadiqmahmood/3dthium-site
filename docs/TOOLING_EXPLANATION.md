# Tool Responsibilities in This Project

## **Biome (Linter & Formatter)**
✅ **Catches:**
- Code formatting issues (indentation, spacing)
- Unused variables and imports
- Basic syntax errors
- Import organization

❌ **Doesn't Catch:**
- React Hooks rules violations (that's ESLint's job)
- TypeScript type errors (that's TypeScript's job)
- Runtime error patterns
- Complex logic errors

## **ESLint (Next.js Integration)**
✅ **Catches:**
- React Hooks rules (`react-hooks/exhaustive-deps`)
- React best practices
- Next.js specific issues

❌ **Doesn't Catch:**
- Formatting (Biome handles this)
- Type errors (TypeScript handles this)

## **TypeScript Compiler**
✅ **Catches:**
- Type errors (null/undefined access, wrong types)
- Missing properties
- Type mismatches

❌ **Doesn't Catch:**
- Runtime errors (only compile-time)
- Logic errors
- React patterns (only type safety)

## **What Happened in This Case:**

1. **Original Issue**: `useSupabase` hook threw an error → Runtime crash
2. **After Fix**: Hook returns `null` → TypeScript catches type errors
3. **React Hooks Rules**: ESLint caught violations when hooks were called conditionally
4. **Biome**: Would only catch formatting/unused variables, not these issues

## **Improved Biome Config:**

The updated config now includes:
- ✅ `useHookAtTopLevel: error` - Catches some hook issues
- ✅ `recommended: true` - Enables more checks
- ✅ `noUnusedVariables: error` - Stricter on unused code
- ✅ `noConfusingVoidType: error` - Better type safety

But remember: **Biome is not a replacement for TypeScript or ESLint React rules!**

