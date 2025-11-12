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

    // Validate student ID
    if (formData.studentId && !isValidStudentId(formData.studentId)) {
      setError('Invalid Student ID. Please enter a valid ID from the specified ranges.')
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

      // Dispatch custom event to notify NavBar of auth change
      window.dispatchEvent(new Event('authChange'))

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
  const programs = ['B.Sc']
  const departments = ['CSE']
  const batches = ['20', '21', '22', '23', '24', '25', '26', '27']
  const sessions = [
    '2022 - Spring',
    '2022 - Summer',
    '2023 - Spring',
    '2023 - Summer',
    '2024 - Spring',
    '2024 - Summer',
    '2025 - Spring',
    '2025 - Summer',
  ]

  // Valid student ID ranges
  const validStudentIdRanges = [
    { start: '0322210105101101', end: '0322210105101199' },
    { start: '0322220105101001', end: '0322220105101099' },
    { start: '0322310205101001', end: '0322310205101099' },
    { start: '0322320105101001', end: '0322320105101099' },
    { start: '0322410205101001', end: '0322410205101099' },
    { start: '03224205101001', end: '03224205101099' },
    { start: '03225105101001', end: '03225105101099' },
    { start: '03225205101001', end: '03225205101099' },
  ]

  const isValidStudentId = (id: string): boolean => {
    if (!id) return true // Allow empty for optional field
    
    return validStudentIdRanges.some(range => {
      const studentIdNum = BigInt(id)
      const startNum = BigInt(range.start)
      const endNum = BigInt(range.end)
      return studentIdNum >= startNum && studentIdNum <= endNum
    })
  }

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
                autoComplete="off"
              />

              <TextField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="new-password"
                helperText="Min 6 characters: 1 letter, 1 number, 1 special char (!@#$% etc.)"
              />

              <TextField
                label="Student ID"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                fullWidth
                helperText="Enter a valid student ID from the specified ranges"
                error={formData.studentId !== '' && !isValidStudentId(formData.studentId)}
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
                select
                value={formData.department}
                onChange={handleChange}
                fullWidth
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Batch"
                name="batch"
                select
                value={formData.batch}
                onChange={handleChange}
                fullWidth
              >
                {batches.map((batch) => (
                  <MenuItem key={batch} value={batch}>
                    {batch}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Session"
                name="session"
                select
                value={formData.session}
                onChange={handleChange}
                fullWidth
              >
                {sessions.map((sess) => (
                  <MenuItem key={sess} value={sess}>
                    {sess}
                  </MenuItem>
                ))}
              </TextField>

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
