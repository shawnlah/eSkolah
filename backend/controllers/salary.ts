import { NextFunction, Request, Response } from "express";
import { ErrorMessages } from "../interfaces/error";
import { CreateSalaryRequest, ExtraSalaryDetails, MonthEnums, SalaryModelInterface, UpdateSalaryRequest } from "../interfaces/salary";
import { UserModelInterface } from "../interfaces/user";
import logger from "../logger";
import SalaryModel from "../models/salary.model";
import UserModel from "../models/user.model";
import { BaseController } from "./base";

export default class SalaryController extends BaseController {
  // START - Private methods
  private sumOfMoney = (item: ExtraSalaryDetails[]) => item.reduce((aggr, obj) => {
    return aggr + parseFloat(obj.amount)
  }, 0)
  // END - Private methods

  async create(req: Request, res: Response, next: NextFunction) {
    logger.info('[CREATE_SALARY] Receive request to create salary', req.body)
    const { employeeId, month, year, deductions, extraIncomes }: CreateSalaryRequest = req.body
    if (year.toString().length !== 4) return this.clientError(res, "Year must be 4 in length. E.g. 1998")
    let employee: UserModelInterface

    // 1) Get employee details
    try {
      const user = await UserModel.findById(employeeId)
      if (!user) return this.notFound(res, "Employee not found")
      employee = user
    } catch (getError) {
      logger.error('[CREATE_SALARY] Failed to get employee salary details', getError)
      return this.internalServerError(res)
    }

    const { basicPay, employeeEpfPercentage, companyEpfPercentage, socsoPercentage } = employee

    // 2) Calculate net pay (basic - epf contribution - socso contribution - deductions + extras)
    const basicSalary = parseFloat(basicPay)
    const employeeEpfAmount = (parseFloat(employeeEpfPercentage) / 100) * basicSalary
    const companyEpfAmount = (parseFloat(companyEpfPercentage) / 100) * basicSalary
    const socsoAmount = (parseFloat(socsoPercentage) / 100) * basicSalary
    const netPay = basicSalary - employeeEpfAmount - socsoAmount - this.sumOfMoney(deductions) + this.sumOfMoney(extraIncomes)

    // 3) Create new salary
    let salaryObj: SalaryModelInterface
    try {
      salaryObj = await new SalaryModel({
        month,
        year,
        basicPay: basicSalary.toString(),
        employeeEpfAmount: employeeEpfAmount.toString(),
        companyEpfAmount: companyEpfAmount.toString(),
        socsoAmount: socsoAmount.toString(),
        deductions,
        extraIncomes,
        netPay: netPay.toString()
      }).save()
    } catch (salaryError) {
      logger.error('[CREATE_SALARY] Failed to create new salary', salaryError)
      return this.internalServerError(res)
    }

    // 4) Assign salary to user salary history
    employee.salaryHistory.push(salaryObj._id)
    try {
      await employee.save()
      logger.info('[CREATE_SALARY] Updated employee salary history')
    } catch (error) {
      logger.error(`[CREATE_SALARY] Failed to save salary to employee, salaryId=${salaryObj._id}`, error)
      return this.internalServerError(res)
    }
    return this.ok(res)
  }

  async update(req: Request, res: Response, next: NextFunction) {
    logger.info('[UPDATE_SALARY] Receive request to update salary', req.body)
    const { salaryId, month, year, deductions, extraIncomes }: UpdateSalaryRequest = req.body

    // 1) Check if request is trying to update salary not withing the current year or month
    if ((Object.values(MonthEnums).indexOf(month) !== new Date().getMonth()) || (+year !== new Date().getFullYear())) {
      logger.warn("[UPDATE_SALARY] Trying to edit salary that's not within current month or year, throwing error ...")
      return this.clientError(res, ErrorMessages.SALARY_ERROR)
    }

    // 2) Update salary
    try {
      await SalaryModel.updateOne({ _id: salaryId }, {
        deductions,
        extraIncomes
      })
    } catch (error) {
      logger.error(`[UPDATE_SALARY] Failed to update salary with salaryId=${salaryId}`, error)
      return this.internalServerError(res)
    }
    return this.ok(res)
  }
}
