module.exports = (sequelize,DataTypes) => {
    const Book = sequelize.define("Book",{
       id: {
           type: DataTypes.INTEGER,
           primaryKey: true,
           autoIncrement: true
       },
       isbn:{
           type:DataTypes.STRING
       },
       title:{
           type:DataTypes.STRING
       },
        authors:{
        type:DataTypes.STRING
       },
       publication_date:{
           type:DataTypes.DATEONLY
       },
       quantity:{
           type:DataTypes.INTEGER
       },
       price: {
           type:DataTypes.DOUBLE
       }
    });
   
    Book.associate = models =>{
        // Book.belongsTo(models.User,{
        //     foreignKey:{
        //         allowNull:false
        //     }
        // });
        // Book.belongsTo(models.User,{
        //     foreignKey:{
        //         allowNull:false
        //     }
        // });
        Book.hasMany(models.Author,{
            onDelete : "cascade", foreignKey: 'bookId'
        })
        
        Book.belongsToMany(models.User, {
            through: 'UserOrders',
            as: 'users',
            foreignKey: 'bookid'
          });
    };
    return Book;
};

