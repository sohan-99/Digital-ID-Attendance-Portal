'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stack,
  MenuItem,
} from '@mui/material'
import { AppRegistration as RegisterIcon } from '@mui/icons-material'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    program: '',
    department: '',
    batch: '',
    session: '',
    bloodGroup: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Client-side validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const hasLetter = /[A-Za-z]/.test(formData.password)
    const hasNumber = /\d/.test(formData.password)
    const hasSpecial = /[^A-Za-z0-9]/.test(formData.password)

    if (!hasLetter || !hasNumber || !hasSpecial) {
      setError('Password must include at least 1 letter, 1 number, and 1 special character (!@#$%^&* etc.)')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Save token and user
      localStorage.setItem('pundra_token', data.token)
      localStorage.setItem('pundra_user', JSON.stringify(data.user))

      // Redirect to profile
      router.push('/profile')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  const programs = ['BSc', 'MSc', 'BA', 'MA', 'BBA', 'MBA', 'Other']

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <RegisterIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
              Student Registration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your digital ID account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                fullWidth
              />

              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                fullWidth
              />

              <TextField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                fullWidth
                helperText="Min 6 characters: 1 letter, 1 number, 1 special char (!@#$% etc.)"
              />

              <TextField
                label="Student ID"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Program"
                name="program"
                select
                value={formData.program}
                onChange={handleChange}
                fullWidth
              >
                {programs.map((prog) => (
                  <MenuItem key={prog} value={prog}>
                    {prog}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                label="Batch"
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                placeholder="e.g., 2024"
                fullWidth
              />

              <TextField
                label="Session"
                name="session"
                value={formData.session}
                onChange={handleChange}
                placeholder="e.g., 2024-2025"
                fullWidth
              />

              <TextField
                label="Blood Group"
                name="bloodGroup"
                select
                value={formData.bloodGroup}
                onChange={handleChange}
                fullWidth
              >
                {bloodGroups.map((bg) => (
                  <MenuItem key={bg} value={bg}>
                    {bg}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? 'Registering...' : 'Register'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link href="/login" style={{ color: 'inherit', fontWeight: 600 }}>
                    Login here
                  </Link>
                </Typography>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Box>
    </Container>
  )
}
