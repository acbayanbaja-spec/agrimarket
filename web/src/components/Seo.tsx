import { useEffect } from 'react'

type Props = {
  title: string
  description: string
  path?: string
}

const Seo = ({ title, description, path = '/' }: Props) => {
  useEffect(() => {
    document.title = `${title} | AgriMarket`
    const setMeta = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`
      let tag = document.head.querySelector(selector) as HTMLMetaElement | null
      if (!tag) {
        tag = document.createElement('meta')
        if (property) tag.setAttribute('property', name)
        else tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }
    setMeta('description', description)
    setMeta('og:title', `${title} | AgriMarket`, true)
    setMeta('og:description', description, true)
    setMeta('og:type', 'website', true)
    setMeta('twitter:card', 'summary_large_image')
    const canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    const href = `${window.location.origin}${path}`
    if (canonical) canonical.href = href
    else {
      const link = document.createElement('link')
      link.rel = 'canonical'
      link.href = href
      document.head.appendChild(link)
    }
  }, [title, description, path])

  return null
}

export default Seo
