import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtGuard } from '../auth/jwt.guard.js';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { LinksService } from './links.service.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    singpassSub: string;
  };
}

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateLinkDto) {
    return this.linksService.create(req.user.sub, dto.originalUrl);
  }

  @Get(':code')
  async redirect(@Param('code') code: string, @Res() res: Response) {
    const originalUrl = await this.linksService.resolveRedirect(code);
    res.set('Cache-Control', 'no-store');
    res.redirect(302, originalUrl);
  }
}
