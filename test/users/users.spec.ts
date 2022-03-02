import Hash from '@ioc:Adonis/Core/Hash'
import Database from '@ioc:Adonis/Lucid/Database'
import { UserFactory } from 'Database/factories'
import test from 'japa'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

test.group('Users', (group) => {
  test('It should create an user', async (assert) => {
    const userPayload = {
      email: 'test@test.com',
      username: 'test',
      password: 'tests',
      avatar: 'https://images.com/image/1',
    }

    const { body } = await supertest(BASE_URL).post('/users').send(userPayload).expect(201)

    assert.exists(body.user, 'User Undefined')
    assert.exists(body.user.id, 'Id Undefined')
    assert.equal(body.user.email, userPayload.email)
    assert.equal(body.user.username, userPayload.username)
    assert.notExists(body.user.password, 'Password Defined')
    assert.equal(body.user.avatar, userPayload.avatar)
  })

  test('It should return 409 when email is already in use', async (assert) => {
    const { email } = await UserFactory.create()
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        username: 'John',
        email,
        password: 'test',
      })
      .expect(409)

    assert.exists(body.message)
    assert.exists(body.code)
    assert.exists(body.status)
    assert.include(body.message, 'email')
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('It should return 409 when username is already in use', async (assert) => {
    const { username } = await UserFactory.create()
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        username,
        email: 'testmail@test.com',
        password: 'test',
      })
      .expect(409)

    assert.exists(body.message)
    assert.exists(body.code)
    assert.exists(body.status)
    assert.include(body.message, 'username')
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('it should return 422 when required data is not provided', async (assert) => {
    const { body } = await supertest(BASE_URL).post('/users').send({}).expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when e-mail is invalid', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        username: 'John',
        email: '',
        password: 'test',
      })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when password is invalid', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        username: 'John',
        email: 'test@test.com',
        password: 'tes',
      })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should update an user', async (assert) => {
    const { id, password } = await UserFactory.create()
    const email = 'test@test.com'
    const avatar = 'http://github.com/jpdrsanchez.png'

    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({ email, avatar, password })
      .expect(200)

    assert.exists(body.user, 'User undefined')
    assert.equal(body.user.email, email)
    assert.equal(body.user.avatar, avatar)
  })

  test('it should update the password of the user', async (assert) => {
    const user = await UserFactory.create()
    const password = 'test'

    const { body } = await supertest(BASE_URL)
      .put(`/users/${user.id}`)
      .send({ email: user.email, avatar: user.avatar, password })
      .expect(200)

    assert.exists(body.user, 'User undefined')
    assert.equal(body.user.id, user.id)

    await user.refresh()
    assert.isTrue(await Hash.verify(user.password, password))
  })

  test('it should return 422 when required data is not provided', async (assert) => {
    const { id } = await UserFactory.create()

    const { body } = await supertest(BASE_URL).put(`/users/${id}`).send({}).expect(422)
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when providing an invalid email', async (assert) => {
    const { id, password } = await UserFactory.create()

    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({ email: 'test', password })
      .expect(422)
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when providing an invalid password', async (assert) => {
    const { id, email } = await UserFactory.create()

    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({ email, password: '123' })
      .expect(422)
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when providing an invalid avatar', async (assert) => {
    const { id, email, password } = await UserFactory.create()

    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({ email, password, avatar: 'image' })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
})
