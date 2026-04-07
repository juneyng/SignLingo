import { useNavigate } from 'react-router-dom'
import { COLORS } from '@/design-system/colors'
import { Button3D, Card3D } from '@/design-system/components'
import { HandMascot } from '@/design-system/icons'
import { signInWithGoogle } from '@/services/auth'
import useAuth from '@/hooks/useAuth'
import useLanguage from '@/stores/useLanguage'

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()

  if (user) { navigate('/'); return null }

  const handleLogin = async () => {
    try { await signInWithGoogle() } catch (error) { console.error('Login failed:', error.message) }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 animate-[fadeIn_0.7s_ease]">
      <HandMascot size={80} mood="excited" />
      <h1 className="text-2xl font-black mt-4" style={{ color: COLORS.gray800 }}>{t.welcomeBack}</h1>
      <p className="text-sm font-semibold mt-2" style={{ color: COLORS.gray400 }}>{t.signInToSave}</p>
      <Card3D color={COLORS.gray200} padding="p-6" className="mt-6 w-full max-w-sm">
        <Button3D fullWidth color={COLORS.blue} darkColor={COLORS.blueDark} onClick={handleLogin} size="lg">{t.signInGoogle}</Button3D>
        <p className="text-xs font-semibold text-center mt-4" style={{ color: COLORS.gray400 }}>{t.supabaseAuth}</p>
      </Card3D>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
