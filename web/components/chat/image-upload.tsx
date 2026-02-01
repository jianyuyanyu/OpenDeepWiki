"use client"

import * as React from "react"
import { ImagePlus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * 支持的图片格式
 */
export const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
] as const

/**
 * 图片大小限制 (10MB)
 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024

/**
 * 图片上传组件属性
 */
export interface ImageUploadProps {
  /** 已上传的图片列表 (Base64) */
  images: string[]
  /** 图片变更回调 */
  onImagesChange: (images: string[]) => void
  /** 错误回调 */
  onError?: (error: string) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 最大图片数量 */
  maxImages?: number
  /** 自定义类名 */
  className?: string
}

/**
 * 验证图片文件
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 检查文件类型
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number])) {
    return {
      valid: false,
      error: `不支持的图片格式: ${file.type}。仅支持 PNG、JPG、GIF、WebP`,
    }
  }

  // 检查文件大小
  if (file.size > MAX_IMAGE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
    return {
      valid: false,
      error: `图片大小 (${sizeMB}MB) 超过限制 (10MB)`,
    }
  }

  return { valid: true }
}

/**
 * 将文件转换为Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("读取文件失败"))
    reader.readAsDataURL(file)
  })
}

/**
 * 从Base64字符串中提取MIME类型
 */
export function getMimeTypeFromBase64(base64: string): string | null {
  const match = base64.match(/^data:([^;]+);base64,/)
  return match ? match[1] : null
}

/**
 * 验证Base64图片格式
 */
export function validateBase64Image(base64: string): { valid: boolean; error?: string } {
  const mimeType = getMimeTypeFromBase64(base64)
  
  if (!mimeType) {
    return { valid: false, error: "无效的Base64图片格式" }
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(mimeType as typeof SUPPORTED_IMAGE_TYPES[number])) {
    return {
      valid: false,
      error: `不支持的图片格式: ${mimeType}。仅支持 PNG、JPG、GIF、WebP`,
    }
  }

  return { valid: true }
}

/**
 * 图片上传组件
 * 
 * 支持PNG、JPG、GIF、WebP格式
 * 图片大小限制10MB
 * 图片预览功能
 * Base64编码
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function ImageUpload({
  images,
  onImagesChange,
  onError,
  disabled = false,
  maxImages = 5,
  className,
}: ImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newImages: string[] = []
    const errors: string[] = []

    for (const file of Array.from(files)) {
      // 检查是否超过最大数量
      if (images.length + newImages.length >= maxImages) {
        errors.push(`最多只能上传 ${maxImages} 张图片`)
        break
      }

      // 验证文件
      const validation = validateImageFile(file)
      if (!validation.valid) {
        errors.push(validation.error!)
        continue
      }

      try {
        const base64 = await fileToBase64(file)
        newImages.push(base64)
      } catch (err) {
        errors.push(`读取文件 ${file.name} 失败`)
      }
    }

    // 更新图片列表
    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages])
    }

    // 报告错误
    if (errors.length > 0 && onError) {
      onError(errors.join("; "))
    }

    // 清空input以便重复选择同一文件
    e.target.value = ""
  }

  // 移除图片
  const handleRemove = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  // 触发文件选择
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <img
                src={img}
                alt={`预览 ${index + 1}`}
                className="h-16 w-16 rounded-md object-cover border border-border"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className={cn(
                  "absolute -right-1 -top-1 rounded-full p-0.5",
                  "bg-destructive text-destructive-foreground",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "focus:opacity-100",
                  disabled && "cursor-not-allowed"
                )}
                aria-label={`移除图片 ${index + 1}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 上传按钮 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_IMAGE_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
      />
      
      {images.length < maxImages && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={disabled}
          className="w-fit"
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          上传图片
        </Button>
      )}

      {/* 提示信息 */}
      <p className="text-xs text-muted-foreground">
        支持 PNG、JPG、GIF、WebP，单张最大 10MB，最多 {maxImages} 张
      </p>
    </div>
  )
}
