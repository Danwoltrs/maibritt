'use client'

import React, { useState, useEffect } from 'react'
import { Save, RotateCcw, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { SettingsService, SiteSettings, HomepageSections } from '@/services/settings.service'

const rotationSpeedOptions = [
  { value: '8000', label: 'Fast (8s)' },
  { value: '15000', label: 'Medium (15s)' },
  { value: '30000', label: 'Slow (30s)' },
  { value: '45000', label: 'Very Slow (45s)' },
  { value: '60000', label: 'Extra Slow (60s)' }
]

const transitionStyleOptions = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'zoom', label: 'Zoom' }
]

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState<SiteSettings>({
    carouselRotationSpeed: 30000,
    carouselAutoPlay: true,
    carouselTransitionStyle: 'fade',
    carouselPauseOnHover: true
  })
  const [sections, setSections] = useState<HomepageSections>({
    showJournal: true,
    showAvailableWorks: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const loadSettings = async () => {
      try {
        setLoading(true)
        setError(null)
        setSuccess(false)
        const [carouselSettings, homepageSections] = await Promise.all([
          SettingsService.getCarouselSettings(),
          SettingsService.getHomepageSections(),
        ])
        setSettings(carouselSettings)
        setSections(homepageSections)
      } catch (err) {
        console.error('Error loading settings:', err)
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [open])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)
      await Promise.all([
        SettingsService.updateCarouselSettings(settings),
        SettingsService.updateHomepageSections(sections),
      ])
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      setSaving(true)
      setError(null)
      await SettingsService.resetCarouselSettings()
      const carouselSettings = await SettingsService.getCarouselSettings()
      setSettings(carouselSettings)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error resetting settings:', err)
      setError('Failed to reset settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Site Settings</DialogTitle>
          <DialogDescription>Configure your website appearance and behavior</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Settings saved!</AlertDescription>
              </Alert>
            )}

            {/* Homepage Sections */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Homepage Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <div className="flex items-center justify-between py-2.5">
                  <div>
                    <Label className="text-sm">Journal / Blog</Label>
                    <p className="text-xs text-gray-500">Show recent entries on the homepage</p>
                  </div>
                  <Switch
                    checked={sections.showJournal}
                    onCheckedChange={(checked) =>
                      setSections(prev => ({ ...prev, showJournal: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-2.5 border-t">
                  <div>
                    <Label className="text-sm">Available Works</Label>
                    <p className="text-xs text-gray-500">Show gallery locations section</p>
                  </div>
                  <Switch
                    checked={sections.showAvailableWorks}
                    onCheckedChange={(checked) =>
                      setSections(prev => ({ ...prev, showAvailableWorks: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Carousel Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Hero Carousel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Rotation Speed</Label>
                    <Select
                      value={settings.carouselRotationSpeed.toString()}
                      onValueChange={(value) =>
                        setSettings(prev => ({ ...prev, carouselRotationSpeed: parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rotationSpeedOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Transition Style</Label>
                    <Select
                      value={settings.carouselTransitionStyle}
                      onValueChange={(value: any) =>
                        setSettings(prev => ({ ...prev, carouselTransitionStyle: value }))
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transitionStyleOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-t">
                  <Label className="text-sm">Auto-Play</Label>
                  <Switch
                    checked={settings.carouselAutoPlay}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, carouselAutoPlay: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <Label className="text-sm">Pause on Hover</Label>
                  <Switch
                    checked={settings.carouselPauseOnHover}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, carouselPauseOnHover: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
