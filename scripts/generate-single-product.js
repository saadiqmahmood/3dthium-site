const fs = require('fs')
const path = require('path')
const slugify = require('slugify')
const crypto = require('crypto')

const BASE_PATH = '/Users/saadiqmahmood/Downloads/products/vases'
const BASE_URL = 'https://gekjrxtrsqdbnijfznlj.supabase.co/storage/v1/object/public/products/vases'

const titleCase = (str) =>
  str.replace(/\w\S*/g, (txt) => txt[0].toUpperCase() + txt.slice(1).toLowerCase())

const getVariantImageFiles = (folderPath) => {
  return fs
    .readdirSync(folderPath)
    .filter((file) => {
      const ext = path.extname(file).toLowerCase()
      const base = path.basename(file).toLowerCase()
      return (
        (ext === '.png' || ext === '.jpg') && !base.startsWith('dsc') && !base.includes('group')
      )
    })
    .sort()
}

const extractVariantImagesFromSQL = (sqlContent) => {
  // Extract image URLs from previous SQL output
  const regex = /\/vases\/([^/]+)\/([^'"\s]+\.(?:png|jpg))/gi
  const images = []
  let match
  while ((match = regex.exec(sqlContent)) !== null) {
    // Only get the image file name
    images.push(match[2].toLowerCase())
  }
  return images.sort()
}

const generateSQLForFolder = (folder) => {
  const slug = slugify(folder, { lower: true })
  const title = titleCase(folder)
  const productUUID = crypto.randomUUID()
  const folderPath = path.join(BASE_PATH, folder)

  // Read description file
  const descriptionFile = fs.readdirSync(folderPath).find((f) => f.endsWith('.txt'))
  const description = descriptionFile
    ? fs.readFileSync(path.join(folderPath, descriptionFile), 'utf-8').replace(/'/g, "''")
    : ''

  // Find Group.png for thumbnail, fallback to first variant image if not found
  let groupImage = fs
    .readdirSync(folderPath)
    .find((f) => f.toLowerCase().startsWith('group') && /\.(png|jpg|jpeg)$/i.test(f))
  if (!groupImage) {
    const variantImages = getVariantImageFiles(folderPath)
    if (variantImages.length > 0) {
      groupImage = variantImages[0]
      console.log(`⚠️  No group image found for ${folder}, using ${groupImage} as thumbnail.`)
    } else {
      console.log(`⚠️  No images found for ${folder}, thumbnail will be empty.`)
    }
  }
  const thumbnail = groupImage
    ? `${BASE_URL}/${encodeURIComponent(folder)}/${encodeURIComponent(groupImage)}`
    : ''

  // Product SQL
  const productSQL = `-- ${title}
INSERT INTO products (id, slug, title, description, category, thumbnail_url)
VALUES ('${productUUID}', '${slug}', '${title}', '${description}', 'Vases', '${thumbnail}');`

  // Variants
  const imageFiles = getVariantImageFiles(folderPath)
  const variantSQLs = imageFiles.map((image) => {
    const color = titleCase(path.basename(image, path.extname(image)).replace(/_/g, ' '))
    const imageUrl = `${BASE_URL}/${encodeURIComponent(folder)}/${encodeURIComponent(image)}`
    return `INSERT INTO product_variants (product_id, color, image_url, price, in_stock, customizable)
VALUES ('${productUUID}', '${color}', '${imageUrl}', 14.99, true, false);`
  })

  const output = [productSQL, '', ...variantSQLs].join('\n\n')
  const outputPath = `./scripts/output/${slug}.sql`

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, output)
  console.log(`✅ SQL written to ${outputPath}`)
}

const batchProcessVases = () => {
  const folders = fs.readdirSync(BASE_PATH).filter((f) => {
    const fullPath = path.join(BASE_PATH, f)
    return fs.statSync(fullPath).isDirectory()
  })

  folders.forEach((folder) => {
    const slug = slugify(folder, { lower: true })
    const outputPath = `./scripts/output/${slug}.sql`
    const folderPath = path.join(BASE_PATH, folder)
    const imageFiles = getVariantImageFiles(folderPath)

    if (fs.existsSync(outputPath)) {
      const sqlContent = fs.readFileSync(outputPath, 'utf-8')
      const prevImages = extractVariantImagesFromSQL(sqlContent)
      const currImages = imageFiles.map((f) => f.toLowerCase()).sort()
      const changed = JSON.stringify(prevImages) !== JSON.stringify(currImages)
      if (!changed) {
        console.log(`⏩ Skipped ${folder} (no variant changes)`)
        return
      } else {
        console.log(`🔄 Regenerating SQL for ${folder} (variant images changed)`)
      }
    } else {
      console.log(`🆕 Generating SQL for ${folder}`)
    }
    generateSQLForFolder(folder)
  })
}

batchProcessVases()
