import Factory from '@ioc:Adonis/Lucid/Factory'
import User from 'App/Models/User'

export const UserFactory = Factory.define(User, ({ faker }) => {
  return {
    username: faker.name.findName(),
    email: faker.internet.email(),
    avatar: faker.internet.avatar(),
    password: faker.internet.password(),
  }
}).build()
