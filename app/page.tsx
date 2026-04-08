import { redirect } from "next/navigation";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(resolvedSearchParams || {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) {
          params.append(key, item)
        }
      }
      continue
    }

    if (value !== undefined) {
      params.set(key, value)
    }
  }

  const query = params.toString()
  redirect(query ? `/eventos?${query}` : "/eventos")
}
