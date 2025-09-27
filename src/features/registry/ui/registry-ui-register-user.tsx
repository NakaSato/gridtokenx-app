import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UiWalletAccount } from '@wallet-ui/react'
import { useState } from 'react'
import { useRegistryRegisterUserMutation } from '../data-access/use-registry-register-user-mutation'

export function RegistryUiRegisterUser({ account }: { account: UiWalletAccount }) {
  const [location, setLocation] = useState('')
  const [userType, setUserType] = useState<'Prosumer' | 'Consumer'>('Consumer')
  const registerMutation = useRegistryRegisterUserMutation({ account })

  const handleRegister = async () => {
    if (!location.trim()) {
      return
    }

    await registerMutation.mutateAsync({
      userType,
      location: location.trim(),
    })
    
    // Reset form
    setLocation('')
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Register for P2P Energy Trading</h3>
      
      <div className="space-y-2">
        <Label htmlFor="userType">User Type</Label>
        <select
          id="userType"
          className="w-full p-2 border rounded"
          value={userType}
          onChange={(e) => setUserType(e.target.value as 'Prosumer' | 'Consumer')}
        >
          <option value="Consumer">Consumer (Buy Energy)</option>
          <option value="Prosumer">Prosumer (Buy & Sell Energy)</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          type="text"
          placeholder="Enter your location (e.g., Downtown Campus)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={100}
        />
      </div>

      <Button 
        onClick={handleRegister}
        disabled={registerMutation.isPending || !location.trim()}
        className="w-full"
      >
        {registerMutation.isPending ? 'Registering...' : 'Register User'}
      </Button>
      
      <p className="text-sm text-muted-foreground">
        Registration creates your onchain profile for energy trading
      </p>
    </div>
  )
}