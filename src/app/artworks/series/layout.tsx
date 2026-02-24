import AdminLayout from '@/components/admin/Layout/AdminLayout'

export default function SeriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminLayout title="Work" subtitle="Organize your artworks into meaningful collections">
      {children}
    </AdminLayout>
  )
}