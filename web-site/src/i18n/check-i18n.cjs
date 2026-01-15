// i18n 诊断脚本
const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');

console.log('='.repeat(60));
console.log('i18n Admin 命名空间诊断报告');
console.log('='.repeat(60));

// 检查所有Admin文件
const languages = ['en-US', 'zh-CN', 'ja-JP', 'ko-KR'];
const adminFiles = languages.map(lang => path.join(localesPath, 'admin', `${lang}.json`));

console.log('\n1. 检查 Admin 文件是否存在:');
adminFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✓' : '✗'} ${path.basename(path.dirname(file))}/${path.basename(file)}`);
});

console.log('\n2. 检查 Admin 文件内容:');
adminFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`   ✗ ${path.basename(file)} - 文件不存在`);
    return;
  }

  try {
    const content = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(content);
    const topLevelKeys = Object.keys(data);
    console.log(`   ✓ ${path.basename(file)} - ${topLevelKeys.length} 个顶级键`);

    // 检查关键键
    const criticalKeys = ['title', 'dashboard', 'users', 'repositories', 'roles'];
    criticalKeys.forEach(key => {
      const exists = key in data;
      if (exists) {
        const value = data[key];
        const displayValue = typeof value === 'object' ? `{${Object.keys(value).length} keys}` : `"${value}"`;
        console.log(`     - ${key}: ${displayValue}`);
      } else {
        console.log(`     - ${key}: 缺失`);
      }
    });
  } catch (error) {
    console.log(`   ✗ ${path.basename(file)} - 解析错误: ${error.message}`);
  }
});

console.log('\n3. 检查补充文件:');
const supplementFiles = languages.map(lang =>
  path.join(localesPath, `i18n-complete-supplement-${lang}.json`)
);

supplementFiles.forEach(file => {
  const exists = fs.existsSync(file);
  if (exists) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(content);
      const hasAdmin = 'admin' in data;
      console.log(`   ✓ ${path.basename(file)} - ${hasAdmin ? '包含admin' : '无admin'}`);
      if (hasAdmin) {
        console.log(`     - admin 对象包含 ${Object.keys(data.admin).length} 个键`);
      }
    } catch (error) {
      console.log(`   ✗ ${path.basename(file)} - 解析错误`);
    }
  } else {
    console.log(`   ✗ ${path.basename(file)} - 不存在`);
  }
});

console.log('\n4. 检查 i18n 配置文件:');
const configPath = path.join(__dirname, 'index.ts');
if (fs.existsSync(configPath)) {
  console.log(`   ✓ index.ts 存在`);

  const content = fs.readFileSync(configPath, 'utf8');

  // 检查关键配置
  const checks = [
    { name: '导入 admin 文件', pattern: /import\s+admin\w+\s+from\s+['"].*admin\/\w+\.json['"]/ },
    { name: 'admin 命名空间', pattern: /ns:\s*\[\s*['"]translation['"],\s*['"]admin['"]\s*\]/ },
    { name: 'buildLocale 函数', pattern: /const\s+buildLocale/ },
    { name: 'admin 资源合并', pattern: /admin:\s*adminWithPrefix/ },
  ];

  checks.forEach(check => {
    const matches = check.pattern.test(content);
    console.log(`   ${matches ? '✓' : '✗'} ${check.name}`);
  });
} else {
  console.log('   ✗ index.ts 不存在');
}

console.log('\n5. 诊断建议:');
console.log('   如果 Admin 翻译不显示，请检查：');
console.log('   1. 组件是否使用 useTranslation(\"admin\")');
console.log('   2. 翻译键名是否正确 (如: t(\"dashboard.title\"))');
console.log('   3. 浏览器控制台是否有错误');
console.log('   4. 网络请求是否成功加载了翻译文件');

console.log('\n' + '='.repeat(60));
