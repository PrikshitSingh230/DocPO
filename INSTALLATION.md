# DocPo — Installation Guide

## What You Will Do

1. Open Apps Script inside Google Docs
2. Add all `.gs` (script) files
3. Add all `.html` (UI) files
4. Run the setup function
5. Reload the document
6. Start using DocPo

---

## 1. Open Google Docs

1. Open a Google Doc (preferably a blank test document)
2. Click: **Extensions → Apps Script**

This opens the Apps Script editor in a new tab.

---

## 2. Prepare the Script Editor

You may see a default file like `Code.gs`. You can either delete its contents or ignore it and create new files.

---

## 3. Add Script Files (.gs)

For each `.gs` file in the repository:

1. Click the **+ (Add file)** button in the left sidebar
2. Select **Script**
3. Enter the file name **without `.gs`**
4. Paste the code
5. Click **Save**

**Example:** If the repo contains `01_main.gs`, create a file named `01_main` and paste its contents.

### Required Script Files

Add all `.gs` files from the repo, including:

- `00_config`
- `01_main`
- `03_doc_helper`
- `04_paragraphs`
- `05_table`
- `06_images`
- `07_footnotes`
- `08_cleanups`
- `10_branding`
- any additional UI or menu `.gs` files

---

## 4. Add HTML Files

For each `.html` file:

1. Click **+ (Add file)**
2. Select **HTML**
3. Enter the file name **without `.html`**
4. Paste the code
5. Click **Save**

**Example:** `loaderSidebar.html` → create file named `loaderSidebar`

### Required HTML Files

- `loaderSidebar`
- `settings` (if present)
- any additional HTML files in the repo

---

## 7. Save the Project

Click **Save project** and confirm all files are saved.

---

## 8. Run Initial Setup

This step installs DocPo into your document.

1. At the top of the editor, find the function dropdown
2. Select `installDocPo`
3. Make sure you are running it from `01_main.gs`
4. Click **Run**

---

## 9. Authorize Permissions

On first run, Google will ask for permissions.

1. Click **Review permissions**
2. Choose your Google account
3. Click **Allow**

This is required for the script to access your document.

---

## 10. Reload the Document

After running `installDocPo`, go back to your Google Doc and reload the page.

---

## 11. Verify Installation

After reload, you should see a new menu:

```
🐼 DocPo
```

Click it to access DocPo tools.

---

## 12. First Test

Before using on real work, test with:

- A few paragraphs
- A heading
- A small table

This ensures everything is working correctly.

---

## 13. Troubleshooting

**Menu not visible**
- Make sure `installDocPo` was run
- Reload the document again

---

**Error: "No HTML file named loaderSidebar was found"**
- Create an HTML file named exactly `loaderSidebar`
- Paste the correct HTML code
- Save and reload

---

**Formatting does not run**
- Check that all `.gs` files are added
- Check that all `.html` files are added
- Verify file names match exactly (case-sensitive)
- Confirm no file is missing

---

**Error related to `toast()`**

Google Docs does not support `doc.toast(...)`. If you see this error, remove any `toast()` calls from the script.

---

## 14. File Placement Summary

| File Type | Where to Add |
|-----------|--------------|
| `.gs` | Script file |
| `.html` | HTML file |

---

## 15. Important Notes

- File names must match exactly — they are case-sensitive
- Do not mix `.gs` and `.html` content in the same file
- Always reload the document after setup
- Always run `installDocPo` once after adding all files

---

## Installation Complete

Once the menu appears and formatting works, DocPo is ready to use. If anything is unclear, re-check file names and ensure all files were copied correctly.

---

### Example

If the repo contains:
