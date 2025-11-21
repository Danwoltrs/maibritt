'use client'

import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Save, RotateCcw, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SettingsService, SiteSettings } from '@/services/settings.service'

const rotationSpeedOptions = [
  { value: '8000', label: 'Fast (8 seconds)' },
  { value: '15000', label: 'Medium (15 seconds)' },
  { value: '30000', label: 'Slow (30 seconds)' },
  { value: '45000', label: 'Very Slow (45 seconds)' },
  { value: '60000', label: 'Extra Slow (60 seconds)' }
]

const transitionStyleOptions = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'zoom', label: 'Zoom' }
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    carouselRotationSpeed: 30000,
    carouselAutoPlay: true,
    carouselTransitionStyle: 'fade',
    carouselPauseOnHover: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const carouselSettings = await SettingsService.getCarouselSettings()
        setSettings(carouselSettings)
      } catch (err) {
        console.error('Error loading settings:', err)
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      await SettingsService.updateCarouselSettings(settings)

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

      // Reload settings
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-600">Configure your website appearance and behavior</p>
        </div>
        <SettingsIcon className="h-8 w-8 text-gray-400" />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      {/* Carousel Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Carousel Settings</CardTitle>
          <CardDescription>
            Control how the homepage carousel behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rotation Speed */}
          <div className="space-y-2">
            <Label htmlFor="rotation-speed">Rotation Speed</Label>
            <Select
              value={settings.carouselRotationSpeed.toString()}
              onValueChange={(value) =>
                setSettings(prev => ({ ...prev, carouselRotationSpeed: parseInt(value) }))
              }
            >
              <SelectTrigger id="rotation-speed">
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
            <p className="text-sm text-gray-500">
              How long each artwork is displayed before transitioning to the next
            </p>
          </div>

          {/* Transition Style */}
          <div className="space-y-2">
            <Label htmlFor="transition-style">Transition Style</Label>
            <Select
              value={settings.carouselTransitionStyle}
              onValueChange={(value: any) =>
                setSettings(prev => ({ ...prev, carouselTransitionStyle: value }))
              }
            >
              <SelectTrigger id="transition-style">
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
            <p className="text-sm text-gray-500">
              The animation effect when transitioning between artworks
            </p>
          </div>

          {/* Auto Play Toggle */}
          <div className="flex items-center justify-between py-4 border-t">
            <div className="space-y-1">
              <Label htmlFor="auto-play">Auto-Play</Label>
              <p className="text-sm text-gray-500">
                Automatically cycle through artworks
              </p>
            </div>
            <Switch
              id="auto-play"
              checked={settings.carouselAutoPlay}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, carouselAutoPlay: checked }))
              }
            />
          </div>

          {/* Pause on Hover Toggle */}
          <div className="flex items-center justify-between py-4 border-t">
            <div className="space-y-1">
              <Label htmlFor="pause-hover">Pause on Hover</Label>
              <p className="text-sm text-gray-500">
                Pause the carousel when visitors hover over it
              </p>
            </div>
            <Switch
              id="pause-hover"
              checked={settings.carouselPauseOnHover}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, carouselPauseOnHover: checked }))
              }
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-1 h-16 bg-blue-500 rounded-full" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">Preview Changes</h3>
              <p className="text-sm text-gray-600">
                To see your changes in action, save the settings and refresh the homepage.
                The carousel will use the new settings immediately.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
