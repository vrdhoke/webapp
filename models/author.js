module.exports = (sequelize,DataTypes) => {
    const Author = sequelize.define("Author",{
       id: {
           type: DataTypes.INTEGER,
           primaryKey: true,
           autoIncrement: true
       },
       name:{
           type:DataTypes.STRING
       }
    });
    // Author.associate = models =>{
    //     Author.belongsTo(models.Book,{
    //         foreignKey:{
    //             allowNull:false
    //         }            
    //     })
    // }
    return Author;
}