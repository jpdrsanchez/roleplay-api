import Mail from '@ioc:Adonis/Addons/Mail'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import ForgotPasswordValidator from 'App/Validators/ForgotPasswordValidator'
import { randomBytes } from 'crypto'
import { promisify } from 'util'

export default class PasswordsController {
  public async forgotPassowrd({ request, response }: HttpContextContract) {
    const { email, resetPasswordUrl } = await request.validate(ForgotPasswordValidator)

    const user = await User.findByOrFail('email', email)

    const ramdom = await promisify(randomBytes)(24)
    const token = ramdom.toString('hex')

    await user.related('tokens').updateOrCreate(
      {},
      {
        token,
      }
    )

    const resetUrlWithToken = `${resetPasswordUrl}?token=${token}`

    await Mail.send((message) => {
      message
        .from('no-reply@roleplay.com')
        .to(email)
        .subject('Roleplay: Recuperação de Senha')
        .htmlView('email/forgotpassword', {
          productName: 'Roleplay',
          name: user.username,
          resetPasswordUrl: resetUrlWithToken,
        })
    })

    return response.noContent()
  }

  public async resetPassowrd({ request, response }: HttpContextContract) {
    const { token, password } = request.only(['password', 'token'])

    const userByToken = await User.query()
      .whereHas('tokens', (query) => {
        query.where('token', token)
      })
      .firstOrFail()

    userByToken.password = password
    await userByToken.save()

    return response.noContent()
  }
}
