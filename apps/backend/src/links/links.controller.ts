import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtGuard, type SessionPayload } from '../auth/session/jwt.guard.js';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { LinksService } from './links.service.js';

type AuthenticatedRequest = Request & {
  user: SessionPayload;
};

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get()
  @UseGuards(JwtGuard)
  findAll(@Req() req: AuthenticatedRequest) {
    return this.linksService.findAllByUser(req.user.sub);
  }

  @Post()
  @UseGuards(JwtGuard)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateLinkDto) {
    return this.linksService.create(
      req.user.sub,
      dto.originalUrl,
      dto.expiresAt,
      dto.customShortCode,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard)
  delete(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.linksService.delete(req.user.sub, id);
  }

  @Get(':code')
  async redirect(@Param('code') code: string, @Res() res: Response) {
    const originalUrl = await this.linksService.resolveRedirect(code);
    res.set('Cache-Control', 'no-store');
    res.redirect(302, originalUrl);
  }
}
