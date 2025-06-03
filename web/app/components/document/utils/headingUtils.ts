/**
 * 从Markdown文本中提取标题信息
 * @param markdown Markdown文本内容
 * @returns 提取的标题数组
 */
export const extractHeadings = (markdown: string): {key: string, title: string, level: number, id: string}[] => {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const matches = Array.from(markdown.matchAll(headingRegex));
  
  return matches.map((match, index) => {
    const level = match[1].length;
    const title = match[2];
    const key = `heading-${index}`;
    
    // 生成有效的CSS ID，移除或转换特殊字符
    let id = title
      .toLowerCase()
      .trim()
      // 移除Markdown标记
      .replace(/[*_`~]/g, '')
      // 将空格和特殊字符替换为连字符
      .replace(/[\s\-\.\,\!\?\:\;\(\)\[\]\{\}\/\\]+/g, '-')
      // 移除中文字符和其他非ASCII字符，替换为拼音或移除
      .replace(/[\u4e00-\u9fa5]/g, '')
      // 移除其他特殊字符
      .replace(/[^\w\-]/g, '')
      // 移除开头和结尾的连字符
      .replace(/^-+|-+$/g, '')
      // 确保不为空，如果为空则使用索引
      || `heading-${index}`;
    
    // 确保ID以字母开头（CSS要求）
    if (!/^[a-zA-Z]/.test(id)) {
      id = `heading-${id}`;
    }
    
    
    return { key, title, level, id };
  });
};

/**
 * 将平面标题列表转换为嵌套的锚点项目结构
 * @param headings 标题数组
 * @returns 组织后的锚点项目数组
 */
export const createAnchorItems = (headings: {key: string, title: string, level: number, id: string}[]) => {
  if (!headings.length) return [];
  
  // 创建嵌套结构的目录
  const result: any[] = [];
  const levels: any[] = [{ children: result }];
  
  headings.forEach(heading => {
    const item = {
      key: heading.key,
      href: `#${heading.id}`,
      title: heading.title,
      children: [],
    };
    
    // 查找适当的父级
    while (levels.length > 1 && levels[levels.length - 1].level >= heading.level) {
      levels.pop();
    }
    
    // 将当前项添加到父级
    levels[levels.length - 1].children.push(item);
    
    // 将当前项添加到级别堆栈
    if (heading.level < 4) { // 只对 h1-h3 建立嵌套结构
      levels.push({ level: heading.level, children: item.children });
    }
  });
  
  return result;
}; 
