import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// 动态导入 admin 翻译文件
import zhCNAdmin from './locales/admin/zh-CN.json'
import enUSAdmin from './locales/admin/en-US.json'
import jaJPAdmin from './locales/admin/ja-JP.json'
import koKRAdmin from './locales/admin/ko-KR.json'

// 翻译资源
const resources = {
  'zh-CN': {
    translation: {
      nav: {
        home: '首页',
        repositories: '仓库',
        docs: '文档',
        about: '关于',
        login: '登录',
        register: '注册',
        profile: '个人资料',
        settings: '设置',
        logout: '退出登录'
      },
      home: {
        title: 'AI 驱动的代码知识库',
        subtitle: '将代码仓库转换为智能知识库',
        searchPlaceholder: '搜索仓库...',
        addRepository: '添加仓库',
        repositories: '仓库',
        noRepositories: '暂无仓库',
        noRepositoriesDesc: '点击上方按钮添加您的第一个仓库'
      },
      repository: {
        form: {
          title: '添加仓库',
          address: '仓库地址',
          addressPlaceholder: '输入 Git 仓库地址',
          branch: '分支',
          branchPlaceholder: '默认: main',
          type: '仓库类型',
          submitType: '提交方式',
          submitTypes: {
            git: 'Git 仓库',
            custom: '自定义仓库',
            file: '文件上传'
          },
          organization: '组织名称',
          organizationPlaceholder: '输入组织名称',
          repositoryName: '仓库名称',
          repositoryNamePlaceholder: '输入仓库名称',
          uploadMethod: '上传方式',
          uploadMethods: {
            file: '本地文件',
            url: 'URL'
          },
          selectFile: '选择文件',
          uploadInfo: '支持上传压缩文件',
          submitSuccess: '仓库添加成功',
          submitFailed: '仓库添加失败',
          cancel: '取消',
          submit: '提交'
        }
      },
      login: {
        title: '登录',
        subtitle: '登录到您的账户',
        form: {
          username: '用户名',
          username_placeholder: '输入用户名或邮箱',
          password: '密码',
          password_placeholder: '输入密码',
          remember_me: '记住我',
          forgot_password: '忘记密码？',
          login: '登录',
          logging_in: '登录中...'
        },
        oauth: {
          github: '使用 GitHub 登录',
          google: '使用 Google 登录'
        },
        no_account: '还没有账户？',
        register_now: '立即注册',
        or_use_credentials: '或使用账号密码',
        messages: {
          success: '登录成功',
          failed: '登录失败',
          error: '登录出错'
        },
        validation: {
          required_fields: '请填写必填字段'
        }
      },
      about: {
        title: '关于 OpenDeepWiki',
        description: 'AI 驱动的代码知识库系统'
      }
    },
    admin: zhCNAdmin.admin
  },
  en: {
    translation: {
      nav: {
        home: 'Home',
        repositories: 'Repositories',
        docs: 'Docs',
        about: 'About',
        login: 'Login',
        register: 'Register',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout'
      },
      home: {
        title: 'AI-Driven Code Knowledge Base',
        subtitle: 'Transform code repositories into intelligent knowledge bases',
        searchPlaceholder: 'Search repositories...',
        addRepository: 'Add Repository',
        repositories: 'Repositories',
        noRepositories: 'No repositories',
        noRepositoriesDesc: 'Click the button above to add your first repository'
      },
      repository: {
        form: {
          title: 'Add Repository',
          address: 'Repository Address',
          addressPlaceholder: 'Enter Git repository address',
          branch: 'Branch',
          branchPlaceholder: 'Default: main',
          type: 'Repository Type',
          submitType: 'Submit Type',
          submitTypes: {
            git: 'Git Repository',
            custom: 'Custom Repository',
            file: 'File Upload'
          },
          organization: 'Organization Name',
          organizationPlaceholder: 'Enter organization name',
          repositoryName: 'Repository Name',
          repositoryNamePlaceholder: 'Enter repository name',
          uploadMethod: 'Upload Method',
          uploadMethods: {
            file: 'Local File',
            url: 'URL'
          },
          selectFile: 'Select File',
          uploadInfo: 'Support compressed file upload',
          submitSuccess: 'Repository added successfully',
          submitFailed: 'Failed to add repository',
          cancel: 'Cancel',
          submit: 'Submit'
        }
      },
      login: {
        title: 'Login',
        subtitle: 'Sign in to your account',
        form: {
          username: 'Username',
          username_placeholder: 'Enter username or email',
          password: 'Password',
          password_placeholder: 'Enter password',
          remember_me: 'Remember me',
          forgot_password: 'Forgot password?',
          login: 'Login',
          logging_in: 'Logging in...'
        },
        oauth: {
          github: 'Login with GitHub',
          google: 'Login with Google'
        },
        no_account: "Don't have an account?",
        register_now: 'Register now',
        or_use_credentials: 'Or use credentials',
        messages: {
          success: 'Login successful',
          failed: 'Login failed',
          error: 'Login error'
        },
        validation: {
          required_fields: 'Please fill in required fields'
        }
      },
      about: {
        title: 'About OpenDeepWiki',
        description: 'AI-Driven Code Knowledge Base System'
      }
    },
    admin: enUSAdmin.admin
  }
}

// 为其他语言添加 admin 命名空间
resources['ja-JP'] = {
  ...resources['ja-JP'] || {},
  admin: jaJPAdmin.admin
}

resources['ko-KR'] = {
  ...resources['ko-KR'] || {},
  admin: koKRAdmin.admin
}

// 初始化 i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'zh-CN', // 默认语言
    fallbackLng: 'en',
    ns: ['translation', 'admin'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false // React 已经做了转义
    },
    debug: false
  })

export default i18n