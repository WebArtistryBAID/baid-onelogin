'use server'

import { findUserOrThrow } from '@/app/lib/utils'

export async function sendVerificationCode(phone: string): Promise<boolean> {
    // Send a verification code to the phone number
    await findUserOrThrow()
    // TODO: Implement this
    console.log('tried sending verification code to', phone)
    return true
}
