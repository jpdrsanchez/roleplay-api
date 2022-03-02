import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BadRequestException from 'App/Exceptions/BadRequestException'
import User from 'App/Models/User'
import CreateUserValidator from 'App/Validators/CreateUserValidator'
import UpdateUserValidator from 'App/Validators/UpdateUserValidator'

export default class UsersController {
  public async index({}: HttpContextContract) {}

  public async create({}: HttpContextContract) {}

  public async store({ response, request }: HttpContextContract) {
    const payload = await request.validate(CreateUserValidator)

    const findByEmail = await User.findBy('email', payload.email)
    const findByName = await User.findBy('username', payload.username)

    if (findByEmail) throw new BadRequestException('email already in use', 409)
    if (findByName) throw new BadRequestException('username already in use', 409)

    const user = await User.create(payload)

    return response.created({ user })
  }

  public async show({}: HttpContextContract) {}

  public async update({ request, response }: HttpContextContract) {
    const { email, password, avatar } = await request.validate(UpdateUserValidator)
    const id = request.param('id')

    const user = await User.findOrFail(id)

    user.email = email
    user.password = password
    if (avatar) user.avatar = avatar
    await user.save()

    return response.ok({ user })
  }

  public async destroy({}: HttpContextContract) {}
}
