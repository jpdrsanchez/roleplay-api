import Hash from '@ioc:Adonis/Core/Hash'
import Mail from '@ioc:Adonis/Addons/Mail'
import Database from '@ioc:Adonis/Lucid/Database'
import { UserFactory } from 'Database/factories'
import test from 'japa'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

test.group('Password', (group) => {
  test('it should send an email with forgot password instructions', async (assert) => {
    const { email, username } = await UserFactory.create()

    Mail.trap((message) => {
      assert.deepEqual(message.to, [
        {
          address: email,
        },
      ])
      assert.deepEqual(message.from, {
        address: 'no-reply@roleplay.com',
      })
      assert.include(message.html!, username)
      assert.equal(message.subject, 'Roleplay: Recuperação de Senha')
    })

    await supertest(BASE_URL)
      .post('/forgot-password')
      .send({
        email,
        resetPasswordUrl: 'url',
      })
      .expect(204)

    Mail.restore()
  })

  test('It should create a reset password token', async (assert) => {
    const user = await UserFactory.create()

    Mail.trap(() => {})

    await supertest(BASE_URL)
      .post('/forgot-password')
      .send({
        email: user.email,
        resetPasswordUrl: 'url',
      })
      .expect(204)

    Mail.restore()

    const tokens = await user.related('tokens').query()
    assert.isNotEmpty(tokens)
  })

  test('it should return 422 when required data is not provided or data is invalid', async (assert) => {
    Mail.trap(() => {})

    const { body } = await supertest(BASE_URL).post('/forgot-password').send({}).expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)

    Mail.restore()
  })

  test.only('it should be able to reset password', async (assert) => {
    const user = await UserFactory.create()
    const { token } = await user.related('tokens').create({ token: 'token' })

    await supertest(BASE_URL)
      .post('/reset-password')
      .send({
        token,
        passowrd: '123456',
      })
      .expect(204)

    await user.refresh()

    console.log(await Hash.verify(user.password, '123456'))

    assert.isTrue(await Hash.verify(user.password, '123456'))
  })

  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
})
