module.exports = (sequelize,DataTypes) => {
     const User = sequelize.define("User",{
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        firstname:{
            type:DataTypes.STRING
        },
        lastname:{
            type:DataTypes.STRING
        },
        email:{
            type:DataTypes.STRING
        },
        password:{
            type:DataTypes.STRING
        },
        role: {
            type:DataTypes.STRING
        }
     });
     User.associate = models =>{
        User.hasMany(models.Book,{
            onDelete : "cascade",as: 'sellbook',foreignKey: 'sellerId'
        });
        User.belongsToMany(models.Book, {
            through: 'UserOrders',
            as: 'books',
            foreignKey: 'userid'
          });
     }
      return User;
}