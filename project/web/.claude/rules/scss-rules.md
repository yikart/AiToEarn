---
paths: "*.scss"
---

# SCSS 编写规范

## CSS Modules 中的 :global() 语法

### 问题: :global() 选择器不能使用 & 后缀

在 CSS Modules 中使用 `:global()` 时,**不能** 使用 Sass 的 `&` 父选择器后缀语法。

#### ❌ 错误写法

```scss
:global(.feedDetailModal_media_content) {
  opacity: 0;
  transition: opacity 0.3s ease;

  // 错误: :global() 选择器不支持 & 后缀
  &-loaded {
    opacity: 1;
  }
}
```

**报错信息**:
```
SassError: Selector ":global(.feedDetailModal_media_content)" can't have a suffix
```

#### ✅ 正确写法

将修饰符选择器单独声明:

```scss
:global(.feedDetailModal_media_content) {
  opacity: 0;
  transition: opacity 0.3s ease;
}

// 修饰符样式单独声明
:global(.feedDetailModal_media_content-loaded) {
  opacity: 1;
}
```

### 替代方案: 使用嵌套 :global

如果需要在同一个块中编写相关样式,可以这样:

```scss
.wrapper {
  :global {
    .feedDetailModal_media_content {
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .feedDetailModal_media_content-loaded {
      opacity: 1;
    }
  }
}
```

## BEM 命名规范(单下划线变体)

项目采用 BEM 命名规范的单下划线变体:

- **Block**: `.block`
- **Element**: `.block_element`(使用单下划线)
- **Modifier**: `.block_element-modifier`(使用短横线)

### 示例

```scss
.feedCard {
  :global {
    .feedCard_header {
      // Element 样式
    }

    .feedCard_header-active {
      // Modifier 样式
    }
  }
}
```

## 常见陷阱

### 1. :global() 中不能使用 & 后缀

如上所述,`:global(.className)` 形式的选择器不支持 Sass 的 `&` 语法。

### 2. 嵌套 :global 块的选择器权重

使用 `:global { }` 块时,内部选择器是全局的,但仍受外层选择器约束:

```scss
.wrapper {
  :global {
    .inner {
      // 实际生成: .wrapper .inner
    }
  }
}
```

### 3. 动态类名拼接

在 React 中拼接类名时,确保使用模板字符串或 classnames 库:

```tsx
// 正确
<div className={`feedDetailModal_media_content ${loaded ? 'feedDetailModal_media_content-loaded' : ''}`}>

// 使用 classnames 库更清晰
import cn from 'classnames'
<div className={cn('feedDetailModal_media_content', {
  'feedDetailModal_media_content-loaded': loaded
})}>
```

## CSS 变量使用

样式中应使用项目定义的 CSS 变量:

```scss
.element {
  color: var(--text-color);
  background: var(--bg-color);
  border-color: var(--border-color);
}
```

参考文件:
- `src/app/var.css` - CSS 变量定义
- `src/app/styles/mixin.scss` - 公共 mixin
