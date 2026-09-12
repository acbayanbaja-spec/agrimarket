import { Smartphone, Share, Download } from 'lucide-react'
import Seo from '../components/Seo'

const GetTheAppPage = () => {
  return (
    <div className="page-shell max-w-3xl">
      <Seo title="Get the AgriMarket app" description="Install AgriMarket on your phone like Shopee — Android, iPhone, and Expo." path="/get-app" />
      <h1 className="text-4xl font-bold mb-3">Put AgriMarket on your phone</h1>
      <p className="text-gray-600 mb-8">
        Same harvests, cart, GCash, and harvest points as the website — with a home-screen icon like Shopee.
      </p>
      <div className="grid gap-6">
        <article className="card animate-fade-up">
          <div className="flex items-center gap-2 mb-2">
            <Download className="h-5 w-5 text-primary-700" />
            <h2 className="text-xl font-semibold">Android (fastest)</h2>
          </div>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>Open this site in Chrome.</li>
            <li>Tap the Install / Add to Home screen banner, or Chrome menu → <strong>Install app</strong>.</li>
            <li>Open the AgriMarket icon on your home screen. It launches full-screen like a store app.</li>
          </ol>
        </article>
        <article className="card animate-fade-up" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <Share className="h-5 w-5 text-primary-700" />
            <h2 className="text-xl font-semibold">iPhone & iPad</h2>
          </div>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>Open this site in Safari.</li>
            <li>Tap the Share button, then <strong>Add to Home Screen</strong>.</li>
            <li>Confirm. AgriMarket appears next to your other apps.</li>
          </ol>
        </article>
        <article className="card animate-fade-up" style={{ animationDelay: '140ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="h-5 w-5 text-primary-700" />
            <h2 className="text-xl font-semibold">Native Expo app (full Android build)</h2>
          </div>
          <p className="text-gray-700 mb-3">
            For the native React Native app in this repo, on a computer run:
          </p>
          <pre className="rounded-xl bg-soil-900 text-primary-100 text-sm p-4 overflow-x-auto">{`cd mobile
npm install
npx expo start`}</pre>
          <p className="text-gray-700 mt-3">
            Scan the QR code with Expo Go on Android, or press <strong>a</strong> with an emulator. Harvest points, budget search, and the add-to-cart sheet work there too.
          </p>
        </article>
      </div>
    </div>
  )
}

export default GetTheAppPage
