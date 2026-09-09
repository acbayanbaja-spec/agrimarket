import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const pages: Record<string, { title: string; body: string[] }> = {
  help: {
    title: 'Help Center',
    body: [
      'Shop from the marketplace, add items to your cart, then check out with cash on delivery, GCash, or bank transfer.',
      'Sellers apply from Become a seller. Admins approve applications from the admin dashboard before a stall can list products.',
      'Need an account? Use Sign up. Demo logins are listed on the login page for admin, seller, and buyer roles.',
    ],
  },
  contact: {
    title: 'Contact us',
    body: [
      'Email hello@agrimarket.ph or message us from this form. We reply on business days.',
      'For order issues, include your order ID from the Orders page.',
    ],
  },
  faq: {
    title: 'FAQ',
    body: [
      'Is AgriMarket only for Metro Manila? No. Listings ship island-wide; delivery windows depend on the farm location.',
      'Can I sell without an admin review? No. Every new seller is reviewed so buyers meet verified farms.',
      'What if I forget my password? Use Forgot password on the login page.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    body: [
      'By creating an account you agree to use AgriMarket for lawful agricultural trade only.',
      'Sellers must describe produce honestly, keep stock current, and fulfill confirmed orders.',
      'AgriMarket may suspend accounts that misrepresent goods or fail to deliver.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      'We store the name, email, and optional phone you provide so we can run your account and orders.',
      'Session tokens stay in your browser. Do not share a logged-in device.',
      'We do not sell personal data. Contact us to request account deletion.',
    ],
  },
  shipping: {
    title: 'Shipping Policy',
    body: [
      'Orders over ₱500 include free delivery. Smaller baskets add a ₱50 delivery fee at checkout.',
      'Metro Manila typically arrives next day. Provincial routes take 2–4 days depending on the farm.',
      'Live fish and chilled poultry ship on ice. Inspect packages on arrival and report damage from Orders.',
    ],
  },
}

type Props = { slug: string }

const ContentPage = ({ slug }: Props) => {
  const page = pages[slug] || pages.help
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="page-shell max-w-3xl">
      <div className="card space-y-4">
        <h1 className="text-4xl font-bold">{page.title}</h1>
        {page.body.map((paragraph) => (
          <p key={paragraph} className="text-gray-700 leading-relaxed">{paragraph}</p>
        ))}
        {slug === 'contact' && (
          sent ? (
            <p className="rounded-xl bg-primary-50 text-primary-800 px-4 py-3">Message sent. We will reply to {email}.</p>
          ) : (
            <form
              className="space-y-3 pt-4"
              onSubmit={(event) => {
                event.preventDefault()
                setSent(true)
              }}
            >
              <input required className="input-field" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} />
              <input required type="email" className="input-field" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
              <textarea required rows={4} className="input-field" placeholder="How can we help?" value={message} onChange={(event) => setMessage(event.target.value)} />
              <button type="submit" className="btn-primary">Send message</button>
            </form>
          )
        )}
        <div className="flex gap-3 pt-2">
          <Link to="/marketplace" className="btn-primary">Marketplace</Link>
          <button type="button" className="btn-outline" onClick={() => navigate(-1)}>Go back</button>
        </div>
      </div>
    </div>
  )
}

export default ContentPage
