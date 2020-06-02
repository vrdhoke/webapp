module.exports = (sequelize,DataTypes) => {
    const UserOrders = sequelize.define('UserOrders', {
        quantity: DataTypes.INTEGER
      }, { timestamps: false });
    return UserOrders;
};

