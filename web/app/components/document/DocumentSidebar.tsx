import React, { useState, useEffect } from 'react';
import './DocumentSidebar.css';

interface AnchorItem {
  key: string;
  title: string;
  href?: string;
  children?: AnchorItem[];
}

interface DocumentSidebarProps {
  anchorItems: AnchorItem[];
  documentData?: any;
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  anchorItems,
  documentData
}) => {
  const [activeAnchor, setActiveAnchor] = useState<string>('');

  // 处理锚点点击事件
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, title: string) => {
    e.preventDefault();
    
    if (href) {
      // 首先尝试通过ID查找元素（需要处理无效选择器）
      let element: Element | null = null;
      
      try {
        element = document.querySelector(href);
      } catch (error) {
        // 如果选择器无效，跳过ID查找
        console.warn('无效的CSS选择器:', href);
      }
      
      // 如果通过ID找不到，尝试通过标题文本查找
      if (!element && title) {
        // 查找所有标题元素
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (const heading of headings) {
          if (heading.textContent?.trim() === title.trim()) {
            element = heading;
            break;
          }
        }
      }
      
      // 如果还是找不到，尝试更宽松的匹配
      if (!element && title) {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (const heading of headings) {
          const headingText = heading.textContent?.trim().toLowerCase() || '';
          const searchTitle = title.trim().toLowerCase();
          if (headingText.includes(searchTitle) || searchTitle.includes(headingText)) {
            element = heading;
            break;
          }
        }
      }
      
      if (element) {
        // 平滑滚动到目标元素
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
        
        // 更新活动锚点
        setActiveAnchor(href);
        
        // 更新URL hash（可选）
        window.history.pushState(null, '', href);
        
        // 添加临时高亮效果
        const htmlElement = element as HTMLElement;
        htmlElement.style.transition = 'background-color 0.3s ease';
        htmlElement.style.backgroundColor = 'rgba(22, 119, 255, 0.1)';
        setTimeout(() => {
          htmlElement.style.backgroundColor = '';
        }, 2000);
      } else {
        console.warn('找不到目标元素:', href, title);
      }
    }
  };

  // 监听滚动事件，自动更新活动锚点
  useEffect(() => {
    const findElementByHrefOrTitle = (href: string, title: string) => {
      // 首先尝试通过ID查找元素（需要处理无效选择器）
      let element: Element | null = null;
      
      try {
        element = document.querySelector(href);
      } catch (error) {
        // 如果选择器无效，跳过ID查找
        console.warn('无效的CSS选择器:', href);
      }
      
      // 如果通过ID找不到，尝试通过标题文本查找
      if (!element && title) {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (const heading of headings) {
          if (heading.textContent?.trim() === title.trim()) {
            element = heading;
            break;
          }
        }
      }
      
      return element;
    };

    const handleScroll = () => {
      // 查找当前可见的章节
      anchorItems.forEach(item => {
        if (item.href) {
          const element = findElementByHrefOrTitle(item.href, item.title);
          if (element) {
            const { top } = element.getBoundingClientRect();
            if (top <= 100) {
              setActiveAnchor(item.href);
            }
          }
        }

        // 检查子项
        if (item.children) {
          item.children.forEach(child => {
            if (child.href) {
              const element = findElementByHrefOrTitle(child.href, child.title);
              if (element) {
                const { top } = element.getBoundingClientRect();
                if (top <= 100) {
                  setActiveAnchor(child.href);
                }
              }
            }
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    // 初始检查当前 hash
    if (window.location.hash) {
      setActiveAnchor(window.location.hash);
    }
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [anchorItems]);

  return (
    <div className="document-sidebar">
      <nav className="sidebar-navigation">
        {anchorItems && anchorItems.length > 0 ? (
          <ul className="sidebar-list">
            {anchorItems.map((item) => (
              <li 
                key={item.key} 
                className={`sidebar-item ${activeAnchor === item.href ? 'active' : ''}`}
              >
                <a 
                  href={item.href}
                  className="sidebar-link"
                  onClick={(e) => handleAnchorClick(e, item.href || '', item.title)}
                >
                  <span className="dot-indicator"></span>
                  {item.title}
                </a>
                
                {item.children && item.children.length > 0 && (
                  <ul className="sidebar-sublist">
                    {item.children.map((child) => (
                      <li 
                        key={child.key} 
                        className={`sidebar-subitem ${activeAnchor === child.href ? 'active' : ''}`}
                      >
                        <a 
                          href={child.href}
                          className="sidebar-sublink"
                          onClick={(e) => handleAnchorClick(e, child.href || '', child.title)}
                        >
                          <span className="dot-indicator small"></span>
                          {child.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="sidebar-empty">暂无目录</div>
        )}
      </nav>
    </div>
  );
};

export default DocumentSidebar; 
