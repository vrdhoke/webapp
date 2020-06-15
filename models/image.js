module.exports = (sequelize, DataTypes) => {
    const Image = sequelize.define(
      "Image",
      {
        s3imagekey: DataTypes.STRING,
        fileName: DataTypes.STRING,
        contentType: DataTypes.STRING,
      },
    );
    return Image;
  };
  