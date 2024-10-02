class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryCopy = { ...this.queryString };
    const excludedFields = [`page`, `sort`, `limit`, `fields`];
    excludedFields.forEach((item) => delete queryCopy[item]);
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortQuery = this.queryString.sort.split(`,`).join(` `);
      this.query = this.query.sort(sortQuery);
    } else {
      this.query = this.query.sort(`-createdAt`);
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(`,`).join(` `);
      this.query = this.query.select(fields);
      // this.query = this.query.select(fields).populate(`reviews`);
    } else {
      this.query = this.query.select(`-__v`);
      // this.query = this.query.select(`-__v`).populate(`reviews`);
    }
    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;
    // console.log(`Executing limit: `, limit);
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;