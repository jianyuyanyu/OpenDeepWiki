import { Header } from '@/components/layout/Header'
import { Separator } from '@/components/ui/separator'
import { useTranslation } from 'react-i18next'
import { FileText, Shield, AlertTriangle, Users, Scale, Ban } from 'lucide-react'

export const TermsPage = () => {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  // In a real application, you might load this from a markdown file or backend API
  // Here we hardcode a standard SaaS/Open Source hybrid Terms of Service for demonstration
  const sections = [
    {
      id: 'acceptance',
      icon: <FileText className="w-5 h-5" />,
      title: '1. Acceptance of Terms',
      content: (
        <>
          <p>
            By accessing or using the OpenDeepWiki platform ("Service"), you agree to be bound by these Terms of Service ("Terms").
            If you do not agree to these Terms, you may not access or use the Service.
          </p>
          <p className="mt-2">
            These Terms apply to all visitors, users, and others who access or use the Service. We reserve the right to update or change these Terms at any time without prior notice.
          </p>
        </>
      )
    },
    {
      id: 'description',
      icon: <Users className="w-5 h-5" />,
      title: '2. Service Description',
      content: (
        <>
          <p>
            OpenDeepWiki provides an AI-powered knowledge base system that analyzes code repositories to generate documentation,
            knowledge graphs, and chat interfaces.
          </p>
          <p className="mt-2">
            The Service is provided "AS IS" and "AS AVAILABLE" basis. We do not warrant that the Service will be uninterrupted,
            timely, secure, or error-free.
          </p>
        </>
      )
    },
    {
      id: 'accounts',
      icon: <Shield className="w-5 h-5" />,
      title: '3. User Accounts & Security',
      content: (
        <>
          <p>
            You are responsible for safeguarding the password and API keys that you use to access the Service and for any activities or actions under your password.
          </p>
          <p className="mt-2">
            You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
          </p>
        </>
      )
    },
    {
      id: 'ai-disclaimer',
      icon: <AlertTriangle className="w-5 h-5" />,
      title: '4. AI Output Disclaimer',
      content: (
        <>
          <p className="font-semibold text-primary/80">
            Important: This Service utilizes Artificial Intelligence (AI) to generate content.
          </p>
          <p className="mt-2">
            AI models can make mistakes ("hallucinations"). You acknowledge that:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
            <li>We do not guarantee the accuracy, completeness, or reliability of any AI-generated content (documentation, code explanations, or answers).</li>
            <li>You are responsible for verifying any code, commands, or information provided by the Service before executing or relying on them in a production environment.</li>
            <li>We are not liable for any damages resulting from the use of AI-generated advice or code snippets.</li>
          </ul>
        </>
      )
    },
    {
      id: 'conduct',
      icon: <Ban className="w-5 h-5" />,
      title: '5. Prohibited Conduct',
      content: (
        <>
          <p>You agree not to use the Service:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 pl-2">
            <li>In any way that violates any applicable national or international law or regulation.</li>
            <li>To transmit any material that is defamatory, obscene, or offensive.</li>
            <li>To attempt to reverse engineer, decompile, or disassemble any aspect of the Service.</li>
            <li>To overwhelm or impose an unreasonable load on our infrastructure (DDoS, spamming, etc.).</li>
          </ul>
        </>
      )
    },
    {
      id: 'intellectual-property',
      icon: <Scale className="w-5 h-5" />,
      title: '6. Intellectual Property',
      content: (
        <>
          <p>
            <strong>Your Content:</strong> You retain all rights to the code repositories and documents you upload or connect to the Service.
            By using the Service, you grant us a license to process this content solely for the purpose of providing the Service (e.g., generating embeddings, indexing).
          </p>
          <p className="mt-2">
            <strong>Our Content:</strong> The Service's original content, features, and functionality are and will remain the exclusive property of OpenDeepWiki and its licensors.
          </p>
        </>
      )
    },
    {
      id: 'limitation',
      icon: <AlertTriangle className="w-5 h-5" />,
      title: '7. Limitation of Liability',
      content: (
        <>
          <p>
            In no event shall OpenDeepWiki, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages,
            including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
        </>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">{t('footer.terms')}</h1>
          <p className="text-muted-foreground text-lg">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="grid gap-8">
          {sections.map((section) => (
            <section key={section.id} className="bg-card rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  {section.icon}
                </div>
                <h2 className="text-xl font-semibold">{section.title}</h2>
              </div>
              <div className="text-muted-foreground leading-relaxed text-sm md:text-base">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <Separator className="my-12" />

        <div className="text-center text-sm text-muted-foreground">
          <p>
            If you have any questions about these Terms, please contact us at{' '}
            <a href="mailto:support@opendeep.wiki" className="text-primary hover:underline">
              support@opendeep.wiki
            </a>
          </p>
          <p className="mt-4">
            &copy; {currentYear} OpenDeepWiki. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TermsPage
